/**
 * A small hand-written force simulation for the project constellation.
 * Loaded lazily (dynamic import) once the map scrolls into view, and never
 * under reduced motion. No dependency: springs to each star's build-time
 * position, springs along edges, short-range collision, cursor repulsion,
 * and a slow per-star idle drift. The caller writes positions to the DOM in
 * `onFrame`, so React does not re-render per frame.
 */

export type Body = {
  id: string;
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
};

type SimEdge = { a: Body; b: Body; rest: number };

export type Sim = {
  bodies: Map<string, Body>;
  pointer(x: number, y: number): void;
  pointerOut(): void;
  /** The star under the cursor is not pushed away, so it stays clickable. */
  hover(id: string | null): void;
  grab(id: string, x: number, y: number): void;
  drag(x: number, y: number): void;
  release(): void;
  setActive(on: boolean): void;
  stop(): void;
};

const HOME_K = 0.018;
const EDGE_K = 0.006;
const DAMPING = 0.86;
const REPEL_R = 90;
const REPEL_F = 0.45;
const DRIFT = 5;
const MAX_V = 24;

export function createSim(opts: {
  nodes: { id: string; x: number; y: number; r: number }[];
  edges: { source: string; target: string }[];
  onFrame: (bodies: Map<string, Body>) => void;
}): Sim {
  const bodies = new Map<string, Body>();
  opts.nodes.forEach((n, i) =>
    bodies.set(n.id, {
      id: n.id,
      hx: n.x,
      hy: n.y,
      x: n.x,
      y: n.y,
      vx: 0,
      vy: 0,
      r: n.r,
      phase: i * 2.399,
    }),
  );
  const list = [...bodies.values()];
  const edges: SimEdge[] = [];
  for (const e of opts.edges) {
    const a = bodies.get(e.source);
    const b = bodies.get(e.target);
    if (a && b)
      edges.push({ a, b, rest: Math.hypot(b.hx - a.hx, b.hy - a.hy) });
  }

  let px: number | null = null;
  let py: number | null = null;
  let held: Body | null = null;
  let hovered: Body | null = null;
  let hx = 0;
  let hy = 0;
  let active = false;
  let frame = 0;
  let t = 0;

  function step() {
    t += 1 / 60;
    for (const b of list) {
      // Home spring, with the home itself drifting on a slow Lissajous path.
      const tx = b.hx + Math.sin(t * 0.35 + b.phase) * DRIFT;
      const ty = b.hy + Math.cos(t * 0.27 + b.phase * 1.3) * DRIFT;
      b.vx += (tx - b.x) * HOME_K;
      b.vy += (ty - b.y) * HOME_K;
      if (px !== null && py !== null && b !== held && b !== hovered) {
        const dx = b.x - px;
        const dy = b.y - py;
        const d = Math.hypot(dx, dy) || 1;
        if (d < REPEL_R) {
          const f = (1 - d / REPEL_R) ** 2 * REPEL_F;
          b.vx += (dx / d) * f;
          b.vy += (dy / d) * f;
        }
      }
    }
    for (const e of edges) {
      const dx = e.b.x - e.a.x;
      const dy = e.b.y - e.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - e.rest) * EDGE_K;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      e.a.vx += fx;
      e.a.vy += fy;
      e.b.vx -= fx;
      e.b.vy -= fy;
    }
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const min = a.r + b.r + 18;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < min) {
          const push = ((min - d) / d) * 0.25;
          a.vx -= dx * push;
          a.vy -= dy * push;
          b.vx += dx * push;
          b.vy += dy * push;
        }
      }
    }
    for (const b of list) {
      if (b === held) {
        b.vx = (hx - b.x) * 0.5;
        b.vy = (hy - b.y) * 0.5;
      } else {
        b.vx *= DAMPING;
        b.vy *= DAMPING;
      }
      const v = Math.hypot(b.vx, b.vy);
      if (v > MAX_V) {
        b.vx = (b.vx / v) * MAX_V;
        b.vy = (b.vy / v) * MAX_V;
      }
      b.x += b.vx;
      b.y += b.vy;
    }
  }

  function loop() {
    frame = 0;
    if (!active) return;
    step();
    opts.onFrame(bodies);
    frame = requestAnimationFrame(loop);
  }

  let wanted = false;
  function sync() {
    const on = wanted && !document.hidden;
    active = on;
    if (on && !frame) frame = requestAnimationFrame(loop);
    if (!on && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  const onVis = () => sync();

  const sim: Sim = {
    bodies,
    pointer(x, y) {
      px = x;
      py = y;
    },
    pointerOut() {
      px = py = null;
      hovered = null;
    },
    hover(id) {
      hovered = id ? (bodies.get(id) ?? null) : null;
    },
    grab(id, x, y) {
      held = bodies.get(id) ?? null;
      hx = x;
      hy = y;
    },
    drag(x, y) {
      hx = x;
      hy = y;
    },
    release() {
      held = null;
    },
    setActive(on) {
      wanted = on;
      sync();
    },
    stop() {
      sim.setActive(false);
      document.removeEventListener("visibilitychange", onVis);
    },
  };
  document.addEventListener("visibilitychange", onVis);
  return sim;
}
