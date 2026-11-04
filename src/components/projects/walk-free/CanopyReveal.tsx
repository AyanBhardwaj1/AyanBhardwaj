"use client";

import { useState } from "react";

const W = 1000;
const H = 560;
const MAPPED = 4375;
const INFERRED = 62748;
const PER_DOT = 75;

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

type Dot = { x: number; y: number; r: number };

/** Deterministic dot fields: street trees someone mapped vs crowns read from a 1 m canopy-height map. */
function fields() {
  const r = rng(42);
  const mapped: Dot[] = [];
  const nMapped = Math.round(MAPPED / PER_DOT);
  for (let i = 0; i < nMapped; i++) {
    // mapped trees sit on streets and quads, in tidy rows
    const row = i % 3;
    const y = [120, 300, 470][row] + (r() - 0.5) * 10;
    const x = 30 + ((i * 53) % 940) + (r() - 0.5) * 8;
    mapped.push({ x, y, r: 6 });
  }
  const inferred: Dot[] = [];
  const nInf = Math.round(INFERRED / PER_DOT);
  const clusters = [
    { x: 180, y: 200, s: 90, w: 0.18 },
    { x: 520, y: 380, s: 120, w: 0.22 },
    { x: 820, y: 160, s: 80, w: 0.14 },
    { x: 760, y: 450, s: 70, w: 0.1 },
  ];
  for (let i = 0; i < nInf; i++) {
    const u = r();
    let x: number;
    let y: number;
    if (u < 0.36) {
      // a creek corridor across the district
      const t = r();
      x = t * W;
      y = 300 + Math.sin(t * Math.PI * 2.2) * 120 + (r() - 0.5) * 70;
    } else {
      let acc = 0.36;
      let c = clusters[0];
      for (const k of clusters) {
        acc += k.w;
        c = k;
        if (acc > u) break;
      }
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * c.s;
      x = c.x + Math.cos(a) * d;
      y = c.y + Math.sin(a) * d;
    }
    inferred.push({
      x: Math.max(6, Math.min(W - 6, x)),
      y: Math.max(6, Math.min(H - 6, y)),
      r: 4.2 + r() * 2,
    });
  }
  return { mapped, inferred };
}

const FIELDS = fields();

const fmt = (n: number) => n.toLocaleString("en-US");

export function CanopyReveal() {
  const { mapped, inferred } = FIELDS;
  const [split, setSplit] = useState(50);
  const sx = (split / 100) * W;
  const shownInf = inferred.filter((d) => d.x >= sx).length;
  const shownCount = Math.round((shownInf / inferred.length) * INFERRED);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="wf-canopy block h-auto w-full bg-(--wf-paper-2)"
          role="img"
          aria-labelledby="wf-can-t"
        >
          <title id="wf-can-t">
            {`Tree cover across an illustrative district. Left of the divider: only trees mapped in OpenStreetMap. Right of the divider: mapped trees plus crowns inferred from Meta and WRI canopy-height maps. One dot stands for about ${PER_DOT} trees.`}
          </title>
          <defs>
            <clipPath id="wf-can-clip">
              <rect x={sx} y="0" width={W - sx} height={H} />
            </clipPath>
          </defs>
          <g className="c-inferred" clipPath="url(#wf-can-clip)">
            {inferred.map((d, i) => (
              <circle
                key={i}
                cx={d.x.toFixed(1)}
                cy={d.y.toFixed(1)}
                r={d.r.toFixed(1)}
              />
            ))}
          </g>
          <g className="c-mapped">
            {mapped.map((d, i) => (
              <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r} />
            ))}
          </g>
          <rect x={sx - 2} y="0" width="4" height={H} fill="var(--wf-ink)" />
          <circle
            cx={sx}
            cy={H / 2}
            r="16"
            fill="var(--wf-gold)"
            stroke="var(--wf-ink)"
            strokeWidth="4"
          />
        </svg>
      </div>
      <label htmlFor="wf-canopy" className="sr-only">
        Divider position: drag right to show only mapped trees, left to reveal
        inferred crowns
      </label>
      <input
        id="wf-canopy"
        type="range"
        className="wf-range mt-2"
        min={0}
        max={100}
        step={1}
        value={split}
        aria-valuetext={`Inferred crowns shown across ${100 - split}% of the map`}
        onChange={(e) => setSplit(Number(e.target.value))}
      />
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <p>
          <span className="wf-num wf-serif block text-[clamp(40px,5vw,72px)] leading-none">
            {fmt(MAPPED)}
          </span>
          <span className="wf-body mt-2 block text-[16px]!">
            <span
              className="mr-2 inline-block size-3 rounded-full bg-(--wf-ink) align-middle"
              aria-hidden="true"
            />
            trees mapped in OpenStreetMap across the six campuses
          </span>
        </p>
        <p aria-live="polite">
          <span className="wf-num wf-serif block text-[clamp(40px,5vw,72px)] leading-none text-(--wf-sage-big)">
            +{fmt(shownCount)}
          </span>
          <span className="wf-body mt-2 block text-[16px]!">
            <span
              className="mr-2 inline-block size-3 rounded-full bg-(--wf-tree) align-middle"
              aria-hidden="true"
            />
            inferred crowns in view
            {shownCount < INFERRED ? ` (of ${fmt(INFERRED)})` : ""}, from the
            canopy-height maps
          </span>
        </p>
      </div>
    </div>
  );
}
