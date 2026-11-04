/**
 * A small drawn district for the Walk-Free page. Pure data + math, no React,
 * safe to run on the server and in the browser (deterministic, so SSR and
 * hydration agree).
 *
 * The model mirrors how Walk-Free works, at toy scale:
 * - the sun's altitude/azimuth for a July day in Austin;
 * - building and tree-crown shadows projected from the sun;
 * - each path sampled every few metres as "in shade" or "in sun";
 * - feels-like = heat index in shade, plus up to 8 °C (14.4 °F) scaled by
 *   sunlight in direct sun;
 * - routes found with cost = shade metres + alpha x sun metres (the
 *   sun-aversion weight from CoolWalks that the app's slider sets).
 *
 * Units: metres. Plan is 1000 x 640, x east, y south (SVG coordinates).
 */

export const PLAN_W = 1000;
export const PLAN_H = 640;

export type Pt = { x: number; y: number };
export type Building = {
  x: number;
  y: number;
  w: number;
  h: number;
  ht: number;
};
export type Tree = { x: number; y: number; r: number; ht: number };
export type Edge = {
  id: string;
  a: string;
  b: string;
  name: string;
  pts: Pt[];
  len: number;
  main?: boolean;
};

const X = [40, 270, 500, 730, 960];
const Y = [40, 240, 420, 600];

const COLS = [
  "Bluff Walk",
  "Ash Street",
  "Kiln Street",
  "Tower Street",
  "Mill Street",
];
const ROWS = ["Lantern Row", "Cedar Lane", "Long Avenue", "Quarry Road"];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const plen = (pts: Pt[]) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++)
    s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return s;
};

/* ---------- graph ---------- */

export const NODES: Record<string, Pt> = {};
for (let i = 0; i < X.length; i++)
  for (let j = 0; j < Y.length; j++) NODES[`n${i}${j}`] = { x: X[i], y: Y[j] };
NODES.lawn = { x: 270, y: 510 };

const edges: Edge[] = [];
const add = (a: string, b: string, name: string, pts?: Pt[], main = false) => {
  const p = pts ?? [NODES[a], NODES[b]];
  edges.push({ id: `${a}-${b}`, a, b, name, pts: p, len: plen(p), main });
};
// east-west streets
for (let j = 0; j < Y.length; j++)
  for (let i = 0; i < X.length - 1; i++) {
    const main = (j === 2 && i >= 2) || j === 3;
    add(`n${i}${j}`, `n${i + 1}${j}`, ROWS[j], undefined, main);
  }
// north-south streets (Ash Street is split by the lawn path's node)
for (let i = 0; i < X.length; i++)
  for (let j = 0; j < Y.length - 1; j++) {
    if (i === 1 && j === 2) {
      add("n12", "lawn", COLS[1]);
      add("lawn", "n13", COLS[1]);
      continue;
    }
    add(`n${i}${j}`, `n${i}${j + 1}`, COLS[i], undefined, i === 4);
  }
// South Lawn path: a sunny diagonal across the open lawn
add("lawn", "n22", "South Lawn path", [NODES.lawn, NODES.n22]);
// Pecan Walk: a meandering, tree-lined walk through the park block
const pecan: Pt[] = [];
for (let k = 0; k <= 24; k++) {
  const t = k / 24;
  const bx = 500 + 230 * t;
  const by = 420 - 180 * t;
  const wob = Math.sin(t * Math.PI * 3) * 50;
  pecan.push({ x: bx + wob * 0.62, y: by + wob * 0.78 });
}
add("n22", "n31", "Pecan Walk", pecan);

export const EDGES = edges;

/* ---------- buildings & trees ---------- */

const LAWN = { x0: 270, x1: 500, y0: 420, y1: 600 };
const PARK = { x0: 500, x1: 730, y0: 240, y1: 420 };

function setback(side: "w" | "e" | "n" | "s", i: number, j: number) {
  // wide avenues keep buildings far from the walk
  if (side === "n" && j === 2) return 26; // block's north edge on Long Avenue
  if (side === "s" && j + 1 === 2) return 26;
  if (side === "e" && i + 1 === 4) return 26; // Mill Street
  return 10;
}

export const BUILDINGS: Building[] = [];
{
  const r = rng(7);
  for (let i = 0; i < X.length - 1; i++)
    for (let j = 0; j < Y.length - 1; j++) {
      const x0 = X[i] + setback("w", i, j);
      const x1 = X[i + 1] - setback("e", i, j);
      const y0 = Y[j] + setback("n", i, j);
      const y1 = Y[j + 1] - setback("s", i, j);
      if (X[i] === LAWN.x0 && Y[j] === LAWN.y0) {
        // a single hall at the lawn's east corner
        BUILDINGS.push({ x: 420, y: 520, w: 66, h: 66, ht: 22 });
        continue;
      }
      if (X[i] === PARK.x0 && Y[j] === PARK.y0) continue;
      const cols = 2 + (r() > 0.5 ? 1 : 0);
      const rows = 2;
      const gap = 12;
      const cw = (x1 - x0 - gap * (cols - 1)) / cols;
      const ch = (y1 - y0 - gap * (rows - 1)) / rows;
      // the block west of Tower and Kiln streets is a taller core
      const tall = i === 2 || i === 1;
      for (let c = 0; c < cols; c++)
        for (let rr = 0; rr < rows; rr++) {
          if (r() < 0.12) continue; // a courtyard
          const ht = Math.round((tall ? 30 : 14) + r() * (tall ? 30 : 22));
          BUILDINGS.push({
            x: x0 + c * (cw + gap),
            y: y0 + rr * (ch + gap),
            w: cw,
            h: ch,
            ht,
          });
        }
    }
}

const BASE_TREES: Tree[] = [];
{
  const r = rng(21);
  // Cedar Lane: lined both sides
  for (let x = 52; x < 950; x += 23) {
    BASE_TREES.push({ x, y: 240 - 7, r: 8 + r() * 2, ht: 8 });
    BASE_TREES.push({ x: x + 11, y: 240 + 7, r: 8 + r() * 2, ht: 8 });
  }
  // Lantern Row: one side
  for (let x = 56; x < 950; x += 21)
    BASE_TREES.push({ x, y: 40 + 5, r: 8 + r() * 2, ht: 8 });
  // Bluff Walk: a broken row
  for (let y = 52; y < 596; y += 19)
    BASE_TREES.push({ x: 40 + 5, y, r: 8 + r() * 2, ht: 7 });
  // Ash Street south of Long Avenue
  for (let y = 430; y < 595; y += 22)
    BASE_TREES.push({ x: 270 - 7, y, r: 8, ht: 8 });
  // Pecan Walk: crowns along both sides of the walk
  for (let k = 1; k < pecan.length - 1; k++) {
    const p = pecan[k];
    const q = pecan[k + 1];
    const nx = -(q.y - p.y);
    const ny = q.x - p.x;
    const n = Math.hypot(nx, ny) || 1;
    const s = k % 2 ? 7 : -7;
    BASE_TREES.push({
      x: p.x + (nx / n) * s,
      y: p.y + (ny / n) * s,
      r: 10,
      ht: 9,
    });
  }
  // the rest of the park
  for (let k = 0; k < 40; k++) {
    const x = PARK.x0 + 14 + r() * (PARK.x1 - PARK.x0 - 28);
    const y = PARK.y0 + 14 + r() * (PARK.y1 - PARK.y0 - 28);
    BASE_TREES.push({ x, y, r: 7 + r() * 5, ht: 8 });
  }
  // a few on the lawn edge
  for (let x = 290; x < 400; x += 30)
    BASE_TREES.push({ x, y: 590, r: 7, ht: 7 });
}
export const TREES = BASE_TREES;

/* ---------- sun ---------- */

const DEG = Math.PI / 180;
const LAT = 30.29 * DEG; // Austin
const DECL = 21.4 * DEG; // mid-July

/** Sun for a local (CDT) clock hour in mid-July at Austin. Radians; az clockwise from north. */
export function sunAt(hour: number) {
  const solar = hour - 1.62; // CDT to apparent solar time at 97.7° W
  const H = (solar - 12) * 15 * DEG;
  const sinAlt =
    Math.sin(LAT) * Math.sin(DECL) +
    Math.cos(LAT) * Math.cos(DECL) * Math.cos(H);
  const alt = Math.asin(sinAlt);
  const cosAz =
    (Math.sin(DECL) - Math.sin(alt) * Math.sin(LAT)) /
    (Math.cos(alt) * Math.cos(LAT));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (H > 0) az = 2 * Math.PI - az;
  return { alt, az };
}

/* ---------- weather (illustrative July day) ---------- */

// shade feels-like (heat index), °F, for 6 AM ... 8 PM
const SHADE_F = [
  78, 79, 83, 88, 92, 96, 100, 103, 105, 106, 106, 105, 103, 99, 94,
];

const lerpTable = (t: number[], hour: number) => {
  const h = Math.max(6, Math.min(20, hour)) - 6;
  const i = Math.min(t.length - 2, Math.floor(h));
  const f = h - i;
  return t[i] * (1 - f) + t[i + 1] * f;
};

export function feelsLike(hour: number) {
  const { alt } = sunAt(hour);
  const shade = lerpTable(SHADE_F, hour);
  const sunlight =
    alt <= 0 ? 0 : Math.min(1, Math.sin(alt) / Math.sin(75 * DEG));
  const sun = shade + 14.4 * sunlight * 0.8; // up to 8 °C, eased by a light wind
  return { shade, sun, sunlight };
}

/* ---------- shadows ---------- */

type Poly = { pts: Pt[]; x0: number; x1: number; y0: number; y1: number };
export type Shadows = { polys: Poly[]; crowns: Tree[]; night: boolean; v: Pt };

function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  for (const q of p) {
    while (
      lo.length >= 2 &&
      cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0
    )
      lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (
      up.length >= 2 &&
      cross(up[up.length - 2], up[up.length - 1], q) <= 0
    )
      up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
}

/** Shadow offset per metre of height, in plan coordinates. */
export function shadowVector(hour: number): { v: Pt; night: boolean } {
  const { alt, az } = sunAt(hour);
  if (alt <= 0.5 * DEG) return { v: { x: 0, y: 0 }, night: true };
  const k = Math.min(9, 1 / Math.tan(alt));
  return { v: { x: -Math.sin(az) * k, y: Math.cos(az) * k }, night: false };
}

export function shadowsAt(hour: number, extraTrees: Tree[] = []): Shadows {
  const { v, night } = shadowVector(hour);
  const crownsAll = TREES.concat(extraTrees);
  if (night) return { polys: [], crowns: [], night, v };
  const polys = BUILDINGS.map((b) => {
    const c = [
      { x: b.x, y: b.y },
      { x: b.x + b.w, y: b.y },
      { x: b.x + b.w, y: b.y + b.h },
      { x: b.x, y: b.y + b.h },
    ];
    const pts = hull(
      c.concat(c.map((q) => ({ x: q.x + v.x * b.ht, y: q.y + v.y * b.ht }))),
    );
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const q of pts) {
      x0 = Math.min(x0, q.x);
      x1 = Math.max(x1, q.x);
      y0 = Math.min(y0, q.y);
      y1 = Math.max(y1, q.y);
    }
    return { pts, x0, x1, y0, y1 };
  });
  const crowns = crownsAll.map((t) => ({
    ...t,
    x: t.x + v.x * t.ht * 0.7,
    y: t.y + v.y * t.ht * 0.7,
  }));
  return { polys, crowns, night, v };
}

function inPoly(p: Pt, poly: Poly) {
  if (p.x < poly.x0 || p.x > poly.x1 || p.y < poly.y0 || p.y > poly.y1)
    return false;
  const q = poly.pts;
  let sign = 0;
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (c !== 0) {
      const s = c > 0 ? 1 : -1;
      if (sign && s !== sign) return false;
      sign = s;
    }
  }
  return true;
}

export function isShaded(p: Pt, s: Shadows) {
  if (s.night) return true;
  for (const c of s.crowns) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    if (dx * dx + dy * dy <= c.r * c.r) return true;
  }
  for (const poly of s.polys) if (inPoly(p, poly)) return true;
  return false;
}

/* ---------- exposure along paths ---------- */

const STEP = 5;

export type Run = { shade: boolean; pts: Pt[] };
export type EdgeExposure = { shadeLen: number; sunLen: number; runs: Run[] };

export function edgeExposure(e: Edge, s: Shadows): EdgeExposure {
  const runs: Run[] = [];
  let shadeLen = 0;
  let sunLen = 0;
  let cur: Run | null = null;
  for (let i = 1; i < e.pts.length; i++) {
    const a = e.pts[i - 1];
    const b = e.pts[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(L / STEP));
    for (let k = 0; k < n; k++) {
      const t0 = k / n;
      const t1 = (k + 1) / n;
      const p0 = { x: a.x + (b.x - a.x) * t0, y: a.y + (b.y - a.y) * t0 };
      const p1 = { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 };
      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const sh = isShaded(mid, s);
      const seg = L / n;
      if (sh) shadeLen += seg;
      else sunLen += seg;
      if (!cur || cur.shade !== sh) {
        cur = { shade: sh, pts: [p0] };
        runs.push(cur);
      }
      cur.pts.push(p1);
    }
  }
  return { shadeLen, sunLen, runs };
}

export function allExposure(s: Shadows) {
  const out = new Map<string, EdgeExposure>();
  for (const e of EDGES) out.set(e.id, edgeExposure(e, s));
  return out;
}

/* ---------- routing ---------- */

export const START = "n03";
export const FINISH = "n40";

export type Route = {
  edges: { e: Edge; forward: boolean }[];
  len: number;
  shadeLen: number;
  sunLen: number;
  pts: Pt[];
};

/** cost = shade metres + alpha x sun metres; main streets get a hair of preference (like a router's). */
export function route(exp: Map<string, EdgeExposure>, alpha: number): Route {
  const adj = new Map<string, { e: Edge; to: string; forward: boolean }[]>();
  for (const e of EDGES) {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a)!.push({ e, to: e.b, forward: true });
    adj.get(e.b)!.push({ e, to: e.a, forward: false });
  }
  const dist = new Map<string, number>([[START, 0]]);
  const prev = new Map<string, { from: string; e: Edge; forward: boolean }>();
  const done = new Set<string>();
  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const [k, d] of dist)
      if (!done.has(k) && d < best) {
        best = d;
        u = k;
      }
    if (u === null || u === FINISH) break;
    done.add(u);
    for (const { e, to, forward } of adj.get(u) ?? []) {
      const x = exp.get(e.id)!;
      const c = (x.shadeLen + alpha * x.sunLen) * (e.main ? 0.995 : 1);
      const nd = best + c;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, { from: u, e, forward });
      }
    }
  }
  const list: { e: Edge; forward: boolean }[] = [];
  let n = FINISH;
  while (n !== START) {
    const p = prev.get(n);
    if (!p) break;
    list.unshift({ e: p.e, forward: p.forward });
    n = p.from;
  }
  let len = 0;
  let shadeLen = 0;
  let sunLen = 0;
  const pts: Pt[] = [];
  for (const { e, forward } of list) {
    const x = exp.get(e.id)!;
    len += e.len;
    shadeLen += x.shadeLen;
    sunLen += x.sunLen;
    const p = forward ? e.pts : [...e.pts].reverse();
    pts.push(...(pts.length ? p.slice(1) : p));
  }
  return { edges: list, len, shadeLen, sunLen, pts };
}

/** Walking at 1.3 m/s. */
export const minutes = (m: number) => m / 78;

export const ptsToD = (pts: Pt[]) =>
  pts
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join("");

export const fmtHour = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round(((h - hh) * 60) / 5) * 5;
  const H = mm === 60 ? hh + 1 : hh;
  const M = mm === 60 ? 0 : mm;
  const ampm = H >= 12 ? "PM" : "AM";
  const h12 = ((H + 11) % 12) + 1;
  return `${h12}:${String(M).padStart(2, "0")} ${ampm}`;
};

/** Trees a planner adds along one street: both sides, evenly spaced, skipping buildings. */
export function plantRow(edgeIds: string[], count: number): Tree[] {
  const es = EDGES.filter((e) => edgeIds.includes(e.id));
  const total = es.reduce((s, e) => s + e.len, 0);
  const perSide = Math.ceil(count / 2);
  const out: Tree[] = [];
  for (let k = 0; k < perSide; k++) {
    let d = ((k + 0.5) / perSide) * total;
    for (const e of es) {
      if (d > e.len) {
        d -= e.len;
        continue;
      }
      const a = e.pts[0];
      const b = e.pts[e.pts.length - 1];
      const t = d / e.len;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const nx = -(b.y - a.y) / e.len;
      const ny = (b.x - a.x) / e.len;
      for (const s of [-1, 1]) {
        if (out.length >= count) break;
        out.push({ x: p.x + nx * 8 * s, y: p.y + ny * 8 * s, r: 9, ht: 8 });
      }
      break;
    }
  }
  return out;
}

export function streetShare(edgeIds: string[], exp: Map<string, EdgeExposure>) {
  let sh = 0;
  let tot = 0;
  for (const id of edgeIds) {
    const x = exp.get(id)!;
    sh += x.shadeLen;
    tot += x.shadeLen + x.sunLen;
  }
  return tot ? sh / tot : 0;
}

export function areaShare(exp: Map<string, EdgeExposure>) {
  let sh = 0;
  let tot = 0;
  for (const x of exp.values()) {
    sh += x.shadeLen;
    tot += x.shadeLen + x.sunLen;
  }
  return tot ? sh / tot : 0;
}

export const HOT_STREETS = [
  { key: "long", name: "Long Avenue", ids: ["n22-n32", "n32-n42"] },
  { key: "mill", name: "Mill Street", ids: ["n40-n41", "n41-n42"] },
  { key: "lawn", name: "South Lawn path", ids: ["lawn-n22"] },
] as const;

/** Stroke colour for sunlit paths, from ochre to brick as sunlight rises. Theme-aware via tokens. */
export const sunStroke = (sunlight: number) =>
  `color-mix(in oklab, var(--wf-heat-hi) ${Math.round(Math.min(1, sunlight) * 100)}%, var(--wf-heat-lo))`;

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];
export const compass = (azRad: number) =>
  COMPASS[Math.round((((azRad * 180) / Math.PI / 22.5) % 16) + 16) % 16];
