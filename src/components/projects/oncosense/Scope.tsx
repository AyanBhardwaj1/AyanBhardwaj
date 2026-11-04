"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ambient-rejection scope. Firmware v2 reads each sample twice, LED off then
 * LED on, and keeps the difference, so room light cancels out. The scope
 * shows the off reading (ambient), the on reading, and the difference, and
 * lights the band's real quality flags. Illustrative numbers in sensor counts
 * (the AS7341 tops out at 65,535).
 */

type Scene = "steady" | "flicker" | "lifted" | "bright";
const SCENES: { id: Scene; label: string }[] = [
  { id: "steady", label: "Steady room" },
  { id: "flicker", label: "Lamp flicker" },
  { id: "lifted", label: "Band lifted" },
  { id: "bright", label: "Bright light" },
];
const N = 72;
const FULL = 65535;
const SIG = 16000;

type Sample = { off: number; on: number; gain: number };

function ambientAt(scene: Scene, t: number, r: () => number) {
  const n = (r() - 0.5) * 900;
  switch (scene) {
    case "steady":
      return 5000 + n;
    case "flicker":
      return 5000 + 9000 * (0.5 + 0.5 * Math.sin(t / 3.2)) + (r() - 0.5) * 3000;
    case "lifted":
      return 26000 + 3000 * Math.sin(t / 4) + n;
    case "bright":
      return 52000 + n;
  }
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function Scope() {
  const [scene, setScene] = useState<Scene>("flicker");
  const [diff, setDiff] = useState(true);
  const [data, setData] = useState<Sample[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const r = makeRng(11);
    let t = 0;
    let gain = 1;
    let satRun = 0;
    const next = (buf: Sample[]) => {
      const amb = ambientAt(scene, t++, r);
      const sig = (scene === "lifted" ? 2400 : SIG) * gain;
      const off = Math.min(FULL, amb * gain);
      const on = Math.min(FULL, (amb + sig / gain) * gain);
      if (on >= FULL) satRun++;
      else satRun = 0;
      if (satRun >= 4 && gain > 0.25) {
        gain /= 2; // auto-gain steps down after a run of clipped samples
        satRun = 0;
      }
      buf.push({ off, on, gain });
      if (buf.length > N) buf.shift();
    };
    const buf: Sample[] = [];
    if (reduce) {
      for (let i = 0; i < N; i++) next(buf);
      const t0 = window.setTimeout(() => setData([...buf]), 0);
      return () => window.clearTimeout(t0);
    }
    for (let i = 0; i < N; i++) next(buf);
    let id = 0;
    const run = () => {
      next(buf);
      setData([...buf]);
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(run, 110);
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, [scene]);

  const W = 600;
  const H = 240;
  const y = (v: number) => 12 + (1 - v / FULL) * (H - 24);
  const x = (i: number) => (i / (N - 1)) * W;
  const line = (f: (s: Sample) => number) =>
    data.map((s, i) => `${x(i).toFixed(1)},${y(f(s)).toFixed(1)}`).join(" ");

  const last = data[data.length - 1];
  const d = last ? last.on - last.off : 0;
  const flags = {
    NO_CONTACT: !!last && d / last.gain < 4000,
    AMBIENT_LEAK: !!last && last.off / last.gain > 20000 && last.off < FULL,
    SATURATED: !!last && last.on >= FULL,
  };
  const outF = diff ? (s: Sample) => s.on - s.off : (s: Sample) => s.on;

  return (
    <div ref={ref} className="os-screen">
      <div className="os-screen-bar">
        <span className="os-live">Scope · 850 nm · 50 ms integration</span>
        <span>gain {last ? `${last.gain}×` : "1×"}</span>
      </div>
      <div className="p-4 sm:p-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          aria-hidden="true"
        >
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1="0"
              x2={W}
              y1={y(g * FULL)}
              y2={y(g * FULL)}
              stroke="var(--os-grid)"
              strokeWidth="1"
            />
          ))}
          <line
            x1="0"
            x2={W}
            y1={y(FULL)}
            y2={y(FULL)}
            stroke="var(--os-alert)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={W - 4}
            y={y(FULL) + 16}
            textAnchor="end"
            fontSize="15"
            className="os-mono"
            fill="var(--os-alert)"
          >
            65,535 full scale
          </text>
          <polyline
            points={line((s) => s.off)}
            fill="none"
            stroke="var(--os-warn)"
            strokeWidth="2"
          />
          <polyline
            points={line((s) => s.on)}
            fill="none"
            stroke="var(--os-ink-soft)"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <polyline
            points={line(outF)}
            fill="none"
            stroke="var(--os-teal)"
            strokeWidth="3.5"
          />
        </svg>
        <ul className="os-small mt-3 flex flex-wrap gap-x-6 gap-y-1">
          <li>
            <span
              className="mr-2 inline-block h-[3px] w-6 bg-(--os-warn) align-middle"
              aria-hidden="true"
            />
            LED off (room light)
          </li>
          <li>
            <span
              className="mr-2 inline-block h-[3px] w-6 align-middle"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--os-ink-soft) 0 5px, transparent 5px 9px)",
              }}
              aria-hidden="true"
            />
            LED on
          </li>
          <li>
            <span
              className="mr-2 inline-block h-[4px] w-6 bg-(--os-teal) align-middle"
              aria-hidden="true"
            />
            {diff
              ? "On minus off (what v2 keeps)"
              : "Raw reading (what v1 kept)"}
          </li>
        </ul>

        <div
          className="mt-5 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Quality flags"
        >
          {Object.entries(flags).map(([k, on]) => (
            <span key={k} className="os-flag" data-on={on}>
              {k}
              <span className="sr-only">{on ? " raised" : " clear"}</span>
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="os-seg" role="group" aria-label="Scenario">
            {SCENES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={scene === s.id}
                onClick={() => setScene(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold">
            <input
              type="checkbox"
              checked={diff}
              onChange={(e) => setDiff(e.target.checked)}
              className="size-5 accent-(--os-teal)"
            />
            Differential read (v2)
          </label>
        </div>
        <p className="sr-only" aria-live="polite">
          {`${SCENES.find((s) => s.id === scene)?.label}. ${diff ? "The difference trace stays level while room light changes." : "Without the differential read, room light moves the reading."} Flags raised: ${
            Object.entries(flags)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(", ") || "none"
          }.`}
        </p>
      </div>
    </div>
  );
}
