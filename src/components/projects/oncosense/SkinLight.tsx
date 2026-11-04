"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Light in skin, as an illustrative Monte Carlo: photons leave the LED,
 * scatter through stratum corneum, epidermis and dermis, and some come back
 * out into the AS7341 beside it (diffuse-reflectance geometry). Near-infrared
 * scatters less and is absorbed less, so it wanders deeper; red is taken up
 * more by melanin and blood; the white LED's short wavelengths stay shallow.
 * Toy coefficients chosen to show the trend, not measured optical properties.
 */

type Src = "850" | "660" | "white";
const W = 800;
const H = 460;
const SURF = 92; // skin surface (px)
const LAYERS = [
  { name: "Stratum corneum", top: SURF, bot: SURF + 12, depth: "~0.02 mm" },
  { name: "Epidermis", top: SURF + 12, bot: SURF + 56, depth: "~0.1 mm" },
  { name: "Dermis", top: SURF + 56, bot: SURF + 330, depth: "~1–2 mm" },
  { name: "Subcutis", top: SURF + 330, bot: H, depth: "" },
];
const LED_X = 300;
const SENSOR_X = 450;
const SENSOR_W = 90;

// [mean free path px, absorption per step] by layer, per wavelength band
const OPT: Record<string, [number, number][]> = {
  nir: [
    [12, 0.0002],
    [18, 0.0006],
    [30, 0.0004],
    [34, 0.0006],
  ],
  red: [
    [10, 0.0004],
    [14, 0.003],
    [22, 0.0012],
    [24, 0.0015],
  ],
  green: [
    [9, 0.0006],
    [10, 0.006],
    [14, 0.004],
    [16, 0.005],
  ],
  blue: [
    [8, 0.001],
    [8, 0.009],
    [10, 0.007],
    [12, 0.008],
  ],
};
const COLOR: Record<string, string> = {
  nir: "#e0628a",
  red: "#ff5a48",
  green: "#6fdc8c",
  blue: "#7aa8ff",
};

type Photon = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  band: string;
  alive: boolean;
  maxDepth: number;
};

function layerAt(y: number) {
  for (let i = 0; i < LAYERS.length; i++) if (y < LAYERS[i].bot) return i;
  return LAYERS.length - 1;
}

export function SkinLight() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [src, setSrc] = useState<Src>("850");
  const [stats, setStats] = useState({ ret: 0, depth: 0 });
  const [motion, setMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setMotion(!mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    const trail = document.createElement("canvas");
    trail.width = W * dpr;
    trail.height = H * dpr;
    const tctx = trail.getContext("2d")!;
    tctx.scale(dpr, dpr);

    let photons: Photon[] = [];
    let emitted = 0;
    let returned = 0;
    let depthSum = 0;
    let depthN = 0;
    let raf = 0;
    let running = false;
    let frame = 0;
    let rnd = Math.random;

    const bandFor = (s: Src) =>
      s === "850"
        ? "nir"
        : s === "660"
          ? "red"
          : (["red", "green", "blue"] as const)[Math.floor(rnd() * 3)];

    const spawn = () => {
      const a = Math.PI / 2 + (rnd() - 0.5) * 0.9;
      photons.push({
        x: LED_X + (rnd() - 0.5) * 30,
        y: SURF,
        dx: Math.cos(a),
        dy: Math.sin(a),
        band: bandFor(src),
        alive: true,
        maxDepth: 0,
      });
      emitted++;
    };

    const step = (p: Photon) => {
      const li = layerAt(p.y);
      const [mfp, mua] = OPT[p.band][li];
      const L = -Math.log(1 - rnd()) * mfp;
      const x0 = p.x;
      const y0 = p.y;
      p.x += p.dx * L;
      p.y += p.dy * L;
      p.maxDepth = Math.max(p.maxDepth, p.y - SURF);
      tctx.strokeStyle = COLOR[p.band];
      tctx.globalAlpha = 0.55;
      tctx.lineWidth = 1.4;
      tctx.beginPath();
      tctx.moveTo(x0, y0);
      if (p.y <= SURF) {
        // exits the skin
        const t = (SURF - y0) / (p.y - y0 || 1);
        const ex = x0 + (p.x - x0) * t;
        tctx.lineTo(ex, SURF);
        tctx.stroke();
        if (ex > SENSOR_X - SENSOR_W / 2 && ex < SENSOR_X + SENSOR_W / 2) {
          returned++;
          depthSum += p.maxDepth;
          depthN++;
          tctx.globalAlpha = 1;
          tctx.fillStyle = COLOR[p.band];
          tctx.beginPath();
          tctx.arc(ex, SURF - 4, 3, 0, Math.PI * 2);
          tctx.fill();
        }
        p.alive = false;
        return;
      }
      tctx.lineTo(p.x, p.y);
      tctx.stroke();
      if (p.x < 0 || p.x > W || p.y > H || rnd() < 1 - Math.exp(-mua * L)) {
        p.alive = false;
        return;
      }
      // forward-biased scattering (Henyey-Greenstein-ish, g ~ 0.6)
      const g = 0.6;
      const s = (1 - g * g) / (1 - g + 2 * g * rnd());
      const cosT = Math.max(-1, Math.min(1, (1 + g * g - s * s) / (2 * g)));
      const th = Math.acos(cosT) * (rnd() < 0.5 ? -1 : 1);
      const ndx = p.dx * Math.cos(th) - p.dy * Math.sin(th);
      const ndy = p.dx * Math.sin(th) + p.dy * Math.cos(th);
      p.dx = ndx;
      p.dy = ndy;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(trail, 0, 0, W, H);
    };

    const tick = () => {
      frame++;
      // fade trails toward the panel colour
      tctx.globalCompositeOperation = "destination-out";
      tctx.globalAlpha = 0.08;
      tctx.fillStyle = "#000";
      tctx.fillRect(0, 0, W, H);
      tctx.globalCompositeOperation = "source-over";
      for (let k = 0; k < 3; k++) spawn();
      for (const p of photons) if (p.alive) step(p);
      photons = photons.filter((p) => p.alive);
      draw();
      if (frame % 20 === 0 && emitted > 0)
        setStats({
          ret: returned / emitted,
          depth: depthN ? depthSum / depthN : 0,
        });
      raf = requestAnimationFrame(tick);
    };

    const staticPaths = () => {
      // three representative random walks, drawn once
      tctx.clearRect(0, 0, W, H);
      let seed = 3;
      const sr = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      rnd = sr;
      for (let i = 0; i < 60; i++) {
        spawn();
        const p = photons[photons.length - 1];
        for (let k = 0; k < 2000 && p.alive; k++) step(p);
      }
      rnd = Math.random;
      photons = [];
      draw();
      setStats({
        ret: returned / Math.max(1, emitted),
        depth: depthN ? depthSum / depthN : 0,
      });
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    if (!motion) {
      staticPaths();
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      {
        rootMargin: "100px",
      },
    );
    io.observe(cv);
    const onVis = () => (document.hidden ? stop() : null);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src, motion]);

  const label =
    src === "850"
      ? "850 nm near-infrared"
      : src === "660"
        ? "660 nm red"
        : "white";
  const pxToMm = (px: number) =>
    px <= 56 ? (px / 56) * 0.12 : 0.12 + ((px - 56) / 274) * 1.9;

  return (
    <figure className="os-screen">
      <div className="os-screen-bar">
        <span className="os-live">Light path · illustrative</span>
        <span>{label} LED</span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {LAYERS.map((l, i) => (
            <rect
              key={l.name}
              x="0"
              y={l.top}
              width={W}
              height={l.bot - l.top}
              fill={["#e8c9a8", "#c99a78", "#a5565a", "#d9c27a"][i]}
              fillOpacity={[0.5, 0.32, 0.16, 0.1][i]}
            />
          ))}
          {/* band face */}
          <rect
            x="200"
            y={SURF - 34}
            width="420"
            height="30"
            rx="6"
            fill="var(--os-sunken)"
          />
          <rect
            x={LED_X - 22}
            y={SURF - 28}
            width="44"
            height="22"
            rx="4"
            fill="var(--os-ink)"
          />
          <circle
            cx={LED_X}
            cy={SURF - 6}
            r="7"
            fill={
              src === "850" ? "#e0628a" : src === "660" ? "#ff5a48" : "#f4f4f4"
            }
          />
          <rect
            x={SENSOR_X - SENSOR_W / 2}
            y={SURF - 28}
            width={SENSOR_W}
            height="22"
            rx="4"
            fill="var(--os-teal)"
          />
          <text
            x={LED_X}
            y={SURF - 44}
            textAnchor="middle"
            className="os-mono"
            fontSize="16"
            fill="var(--os-ink-soft)"
          >
            LED
          </text>
          <text
            x={SENSOR_X}
            y={SURF - 44}
            textAnchor="middle"
            className="os-mono"
            fontSize="16"
            fill="var(--os-ink-soft)"
          >
            AS7341
          </text>
          {LAYERS.slice(0, 3).map((l, i) => (
            <text
              key={l.name}
              x={W - 14}
              y={i === 2 ? l.top + 30 : l.bot - 3}
              textAnchor="end"
              className="os-mono"
              fontSize="15"
              fill="var(--os-ink-soft)"
            >
              {i === 0 ? "" : `${l.name} ${l.depth}`}
            </text>
          ))}
          <text
            x="14"
            y={SURF + 10}
            className="os-mono"
            fontSize="15"
            fill="var(--os-ink-soft)"
          >
            stratum corneum
          </text>
        </svg>
        <canvas
          ref={canvas}
          className="relative block h-auto w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
      <figcaption className="grid gap-4 p-4 sm:flex sm:items-center sm:justify-between">
        <div className="os-seg" role="group" aria-label="Light source">
          {(["850", "660", "white"] as Src[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={src === s}
              onClick={() => setSrc(s)}
            >
              {s === "white" ? "White" : `${s} nm`}
            </button>
          ))}
        </div>
        <p className="os-readout" aria-live="polite">
          returned to sensor {(stats.ret * 100).toFixed(1)}% · mean depth
          reached ~{pxToMm(stats.depth).toFixed(2)} mm
        </p>
      </figcaption>
      <p className="sr-only">
        Animated diagram of {label} light entering skin from the LED, scattering
        through the stratum corneum, epidermis and dermis, and partly returning
        into the spectral sensor beside it. Near-infrared reaches deepest; the
        white LED&rsquo;s short wavelengths stay shallow.
      </p>
    </figure>
  );
}
