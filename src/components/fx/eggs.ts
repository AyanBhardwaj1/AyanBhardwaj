/**
 * Easter eggs for the palette (RAIN <GO>, BELL <GO>, the Konami code).
 * Plain DOM + Canvas 2D, loaded on demand; every overlay removes itself.
 * Reduced motion gets a static toast instead of any movement.
 */

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

let toastEl: HTMLDivElement | null = null;
let toastTimer = 0;

/** A small terminal-style status toast (role=status, auto-dismisses). */
export function fxToast(text: string, ms = 3600) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "fx-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
  }
  const el = toastEl;
  el.removeAttribute("data-on");
  el.textContent = "";
  const prompt = document.createElement("span");
  prompt.className = "fx-toast-k";
  prompt.textContent = "›";
  prompt.setAttribute("aria-hidden", "true");
  el.append(prompt, document.createTextNode(` ${text}`));
  // Next frame, so the entrance transition runs from the hidden state.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.setAttribute("data-on", "")),
  );
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.removeAttribute("data-on"), ms);
}

/* ------------------------------------------------------------------ */
/* Shared full-screen canvas                                           */
/* ------------------------------------------------------------------ */

function overlayCanvas(className: string) {
  const wrap = document.createElement("div");
  wrap.className = className;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  wrap.appendChild(canvas);
  document.body.appendChild(wrap);
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = () => {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  return { wrap, canvas, ctx, size };
}

/* ------------------------------------------------------------------ */
/* RAIN: falling tickers                                               */
/* ------------------------------------------------------------------ */

const SYMBOLS = [
  "AYAN",
  "MOSS",
  "KOYAL",
  "YOUB",
  "MITLL",
  "CSB",
  "UTX",
  "YC",
  "GH",
  "SEC",
  "AEO",
  "RCL5",
  "MAVS",
  "JRVS",
  "SHIP",
];

let rainStop: (() => void) | null = null;

export function rain() {
  if (rainStop) return;
  if (reduced()) {
    fxToast(
      "RAIN: reduced motion is on, so just the forecast: 100% chance of shipping.",
    );
    return;
  }

  const { wrap, ctx, size } = overlayCanvas("fx-rain");
  const hint = document.createElement("p");
  hint.className = "fx-rain-hint";
  hint.innerHTML =
    '<span class="fx-toast-k">▲ AYAN</span> it’s raining tickers · <kbd>Esc</kbd> to close';
  wrap.appendChild(hint);
  const live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("role", "status");
  live.textContent = "Ticker rain. Press Escape or click to close.";
  wrap.appendChild(live);

  const accent = cssVar("--accent", "#ffa31a");
  const up = cssVar("--up", "#3ddc84");
  const down = cssVar("--down", "#ff5a4e");
  const mono = `${cssVar("--font-plex-mono", "ui-monospace")}, ui-monospace, monospace`;

  type Drop = {
    x: number;
    y: number;
    v: number;
    size: number;
    alpha: number;
    text: string;
    color: string;
  };
  let W = window.innerWidth;
  let H = window.innerHeight;
  const drops: Drop[] = [];
  const spawn = (y?: number) => {
    const depth = Math.random();
    const size = 10 + depth * 9;
    const sym = SYMBOLS[(Math.random() * SYMBOLS.length) | 0];
    const r = Math.random();
    const dir = r < 0.66 ? "▲" : r < 0.82 ? "▼" : "·";
    const price = (20 + Math.random() * 480).toFixed(2);
    drops.push({
      x: Math.random() * W,
      y: y ?? -20 - Math.random() * H * 0.4,
      v: 90 + depth * 260 + Math.random() * 60,
      size,
      alpha: 0.35 + depth * 0.65,
      text: `${sym} ${dir}${price}`,
      color:
        dir === "▲" && Math.random() < 0.45 ? up : dir === "▼" ? down : accent,
    });
  };
  const density = Math.round(Math.min(140, (W * H) / 9000));
  for (let i = 0; i < density * 0.6; i++)
    spawn(Math.random() * H * 0.9 - H * 0.3);

  const T_RAIN = 4300;
  const T_END = 5200;
  let raf = 0;
  let t0 = 0;
  let last = 0;
  let closing = false;
  let done = false;

  const tick = (now: number) => {
    if (!t0) t0 = last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now - t0;
    // Fade previous frames toward transparent: motion trails.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    if (t < T_RAIN && drops.length < density) {
      const n = Math.ceil(density * dt * 1.4);
      for (let i = 0; i < n; i++) spawn();
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.v * dt;
      if (d.y - d.size > H) {
        drops.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      ctx.font = `500 ${d.size.toFixed(1)}px ${mono}`;
      ctx.fillText(d.text, d.x, d.y);
    }
    ctx.globalAlpha = 1;
    if (!closing && t > T_RAIN) close(T_END - T_RAIN);
    if (!done) raf = requestAnimationFrame(tick);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close(280);
    }
  };
  const onClick = () => close(280);
  const onResize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    size();
  };

  let endTimer = 0;
  let closeMs = Infinity;
  function close(ms: number) {
    if (closing && ms >= closeMs) return;
    closing = true;
    closeMs = ms;
    wrap.style.setProperty("--fx-out", `${ms}ms`);
    wrap.removeAttribute("data-on");
    clearTimeout(endTimer);
    endTimer = window.setTimeout(cleanup, ms + 40);
  }
  function cleanup() {
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(endTimer);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", onResize);
    wrap.remove();
    rainStop = null;
  }
  rainStop = cleanup;

  window.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", onResize);
  wrap.addEventListener("click", onClick);
  raf = requestAnimationFrame(tick);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => wrap.setAttribute("data-on", "")),
  );
}

/* ------------------------------------------------------------------ */
/* BELL: the closing bell, candlestick confetti from the status bar   */
/* ------------------------------------------------------------------ */

let bellBusy = false;

/** Where to ring from: the NYSE status in the top bar, else top center. */
function bellOrigin() {
  const spans = document.querySelectorAll<HTMLElement>("body > div.fixed span");
  for (const s of spans) {
    if (!/^NYSE/.test(s.textContent ?? "")) continue;
    const r = s.getBoundingClientRect();
    if (r.width && r.top < 40) return { x: r.left + r.width / 2, y: r.bottom };
  }
  return { x: window.innerWidth / 2, y: 32 };
}

export function bell() {
  const message = "Market's closed. Ayan's still shipping.";
  if (reduced() || bellBusy) {
    fxToast(message);
    return;
  }
  bellBusy = true;
  const { wrap, ctx } = overlayCanvas("fx-bell");
  const W = window.innerWidth;
  const H = window.innerHeight;
  const o = bellOrigin();
  const accent = cssVar("--accent", "#ffa31a");
  const up = cssVar("--up", "#3ddc84");

  type P = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    body: number;
    wick: number;
    w: number;
    color: string;
    hollow: boolean;
  };
  const count = Math.round(Math.min(90, 40 + W / 24));
  const ps: P[] = [];
  for (let i = 0; i < count; i++) {
    // A downward fan, wider than it is deep.
    const a = Math.PI * (0.08 + Math.random() * 0.84);
    const s = 260 + Math.random() * 620;
    const green = Math.random() < 0.5;
    ps.push({
      x: o.x + (Math.random() - 0.5) * 24,
      y: o.y,
      vx: Math.cos(a) * s * 1.25,
      vy: Math.sin(a) * s * 0.8,
      rot: (Math.random() - 0.5) * 0.6,
      vr: (Math.random() - 0.5) * 7,
      body: 8 + Math.random() * 16,
      wick: 4 + Math.random() * 8,
      w: 4 + Math.random() * 4,
      color: green ? up : accent,
      hollow: !green && Math.random() < 0.35,
    });
  }

  const DURATION = 2600;
  let t0 = 0;
  let last = 0;
  const tick = (now: number) => {
    if (!t0) t0 = last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);

    // The bell: two soft rings out of the status bar.
    for (const delay of [0, 180]) {
      const k = Math.max(0, Math.min(1, (t - delay) / 900));
      if (k <= 0 || k >= 1) continue;
      ctx.globalAlpha = (1 - k) * 0.5;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 8 + k * 140, 0, Math.PI);
      ctx.stroke();
    }

    const fade = t > DURATION - 700 ? Math.max(0, (DURATION - t) / 700) : 1;
    for (const p of ps) {
      p.vx *= Math.pow(0.35, dt);
      p.vy = p.vy * Math.pow(0.55, dt) + 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 40) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.9 * fade;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.lineWidth = 1.25;
      const h = p.body / 2;
      ctx.beginPath();
      ctx.moveTo(0, -h - p.wick);
      ctx.lineTo(0, h + p.wick * 0.6);
      ctx.stroke();
      if (p.hollow) ctx.strokeRect(-p.w / 2, -h, p.w, p.body);
      else ctx.fillRect(-p.w / 2, -h, p.w, p.body);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (t < DURATION) requestAnimationFrame(tick);
    else {
      wrap.remove();
      bellBusy = false;
    }
  };
  requestAnimationFrame(tick);
  fxToast(message);
}
