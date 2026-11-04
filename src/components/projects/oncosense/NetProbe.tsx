"use client";

import { useMemo, useState } from "react";

/**
 * The on-band network, 12 -> 16 -> 12 -> 5, drawn node for node. Pick an
 * example reading and activations flow left to right. The weights in this
 * drawing are illustrative (seeded), and the readings are examples in the
 * style of the monitor's AI view; the "Normal" case mirrors the monitor
 * screenshot on this page.
 */

const FEATURES = [
  "415 nm",
  "445 nm",
  "480 nm",
  "515 nm",
  "555 nm",
  "590 nm",
  "630 nm",
  "680 nm",
  "680 nm, red LED",
  "NIR, NIR LED",
  "red / green",
  "red / blue",
];
const CLASSES = [
  { name: "very dry", v: "--os-c0" },
  { name: "dry", v: "--os-c1" },
  { name: "normal", v: "--os-c2" },
  { name: "well hydrated", v: "--os-c3" },
  { name: "occlusive", v: "--os-c4" },
];

type Case = {
  id: string;
  label: string;
  x: number[];
  p: number[];
  ood: number;
  novelty: number | null;
};

const CASES: Case[] = [
  {
    id: "normal",
    label: "Baseline arm",
    x: [
      0.05, 0.02, -0.03, 0.04, 0.01, -0.02, 0.03, 0.02, 0.04, 0.01, -0.02, 0.03,
    ],
    p: [0, 0.03, 0.74, 0.23, 0],
    ood: 0.3,
    novelty: null,
  },
  {
    id: "moist",
    label: "After moisturiser",
    x: [
      -0.22, -0.2, -0.18, -0.15, -0.12, -0.1, -0.08, -0.06, -0.09, -0.3, 0.12,
      0.18,
    ],
    p: [0, 0.01, 0.18, 0.78, 0.03],
    ood: 0.9,
    novelty: 1.1,
  },
  {
    id: "dry",
    label: "Dry patch",
    x: [0.34, 0.3, 0.27, 0.22, 0.2, 0.17, 0.14, 0.12, 0.15, 0.36, -0.14, -0.2],
    p: [0.21, 0.66, 0.12, 0.01, 0],
    ood: 1.2,
    novelty: 1.4,
  },
  {
    id: "film",
    label: "Occlusive film",
    x: [0.48, 0.44, 0.4, 0.33, 0.28, 0.22, 0.18, 0.15, 0.2, -0.42, -0.3, -0.36],
    p: [0, 0.02, 0.07, 0.17, 0.74],
    ood: 1.6,
    novelty: 2.1,
  },
  {
    id: "odd",
    label: "Something unfamiliar",
    x: [0.9, -0.7, 0.85, -0.8, 0.6, -0.9, 0.95, -0.6, 0.7, 0.9, -0.95, 0.8],
    p: [0.08, 0.27, 0.31, 0.22, 0.12],
    ood: 4.2,
    novelty: 3.8,
  },
];

const LAYERS = [12, 16, 12, 5];
const SVG_W = 640;
const SVG_H = 440;

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

const WEIGHTS = (() => {
  const r = rng(480);
  return LAYERS.slice(1).map((n, l) =>
    Array.from({ length: n }, () =>
      Array.from({ length: LAYERS[l] }, () => (r() - 0.5) * 2),
    ),
  );
})();

function pos(l: number, i: number) {
  const n = LAYERS[l];
  const x = 30 + l * ((SVG_W - 225) / 3);
  const gap = l === 3 ? 74 : (SVG_H - 40) / Math.max(...LAYERS);
  const y = SVG_H / 2 + (i - (n - 1) / 2) * gap;
  return { x, y };
}

export function NetProbe() {
  const [id, setId] = useState("normal");
  const c = CASES.find((k) => k.id === id)!;

  const acts = useMemo(() => {
    const a: number[][] = [c.x.map((v) => Math.min(1, Math.abs(v) * 2.2))];
    let prev = c.x;
    for (let l = 0; l < 2; l++) {
      const out = WEIGHTS[l].map((row) =>
        Math.max(
          0,
          row.reduce((s, w, j) => s + w * prev[j] * 2.5, 0),
        ),
      );
      const m = Math.max(0.001, ...out);
      a.push(out.map((v) => v / m));
      prev = out.map((v) => v / m - 0.3);
    }
    a.push(c.p);
    return a;
  }, [c]);

  const top = c.p.indexOf(Math.max(...c.p));
  const conf = c.p[top];

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="os-screen lg:col-span-8">
        <div className="os-screen-bar">
          <span className="os-live">
            AI reading · 12→16→12→5 · illustrative weights
          </span>
          <span>~480 params</span>
        </div>
        <div className="p-3 sm:p-5">
          <div className="os-seg" role="group" aria-label="Example reading">
            {CASES.map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={id === k.id}
                onClick={() => setId(k.id)}
              >
                {k.label}
              </button>
            ))}
          </div>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="os-net mt-4 block h-auto w-full"
            aria-hidden="true"
          >
            {WEIGHTS.map((layer, l) =>
              layer.map((row, i) =>
                row.map((w, j) => {
                  const a = pos(l, j);
                  const b = pos(l + 1, i);
                  const strength = Math.min(1, Math.abs(w) * acts[l][j]);
                  return (
                    <line
                      key={`${l}-${i}-${j}`}
                      className="edge"
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      strokeWidth={w > 0 ? 1.2 : 0.8}
                      strokeOpacity={0.04 + strength * 0.5}
                      style={{ transitionDelay: `${l * 160}ms` }}
                    />
                  );
                }),
              ),
            )}
            {LAYERS.map((n, l) =>
              Array.from({ length: n }, (_, i) => {
                const p = pos(l, i);
                const a = acts[l][i];
                const isOut = l === 3;
                return (
                  <circle
                    key={`n${l}-${i}`}
                    className="node"
                    cx={p.x}
                    cy={p.y}
                    r={isOut ? 9 : 6.5}
                    fill={isOut ? `var(${CLASSES[i].v})` : "var(--os-teal)"}
                    fillOpacity={0.15 + a * 0.85}
                    stroke="var(--os-ink-soft)"
                    strokeOpacity="0.4"
                    style={{ transitionDelay: `${l * 160}ms` }}
                  />
                );
              }),
            )}
            {CLASSES.map((k, i) => {
              const p = pos(3, i);
              return (
                <g key={k.name}>
                  <rect
                    x={p.x + 18}
                    y={p.y + 2}
                    width="140"
                    height="12"
                    rx="3"
                    fill="var(--os-sunken)"
                  />
                  <rect
                    x={p.x + 18}
                    y={p.y + 2}
                    width={140 * c.p[i]}
                    height="12"
                    rx="3"
                    fill={`var(${k.v})`}
                    style={{ transition: "width 600ms var(--os-ease) 480ms" }}
                  />
                  <text
                    x={p.x + 18}
                    y={p.y - 6}
                    fontSize="15"
                    className="os-mono"
                    fill="var(--os-ink)"
                  >
                    {k.name} {Math.round(c.p[i] * 100)}%
                  </text>
                </g>
              );
            })}
            <text
              x="30"
              y="16"
              fontSize="15"
              className="os-mono"
              fill="var(--os-ink-soft)"
            >
              12 features
            </text>
            <text
              x={pos(1, 0).x}
              y="16"
              textAnchor="middle"
              fontSize="15"
              className="os-mono"
              fill="var(--os-ink-soft)"
            >
              16
            </text>
            <text
              x={pos(2, 0).x}
              y="16"
              textAnchor="middle"
              fontSize="15"
              className="os-mono"
              fill="var(--os-ink-soft)"
            >
              12
            </text>
          </svg>
          <table className="sr-only">
            <caption>{`Network output for the example "${c.label}"`}</caption>
            <tbody>
              {CLASSES.map((k, i) => (
                <tr key={k.name}>
                  <th scope="row">{k.name}</th>
                  <td>{Math.round(c.p[i] * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <details className="os-small mt-2">
            <summary className="cursor-pointer py-2">
              The 12 input features
            </summary>
            <p className="mt-1">
              Log-change against the wearer&rsquo;s own baseline for eight
              visible bands under the white LED (
              {FEATURES.slice(0, 8).join(", ")}), 680 nm under the red LED, NIR
              under the NIR LED, and two shape ratios (red/green, red/blue).
            </p>
          </details>
        </div>
      </div>

      <div className="lg:col-span-4">
        <p className="os-readout">reading</p>
        <p className="os-h2 mt-2 capitalize" aria-live="polite">
          {c.ood > 3 ? "Unfamiliar" : CLASSES[top].name}
        </p>
        <dl className="mt-8 grid gap-6">
          <Meter
            label="Confidence"
            value={`${Math.round(conf * 100)}%`}
            frac={conf}
          />
          <Meter
            label="Out of distribution"
            value={c.ood.toFixed(1)}
            frac={c.ood / 5}
            mark={3 / 5}
            warn={c.ood > 3}
          />
          <Meter
            label="Personal novelty"
            value={c.novelty === null ? "Learning…" : c.novelty.toFixed(1)}
            frac={c.novelty === null ? 0 : c.novelty / 5}
            mark={3 / 5}
            warn={(c.novelty ?? 0) > 3}
          />
        </dl>
        <p className="os-small mt-6">
          Out of distribution is the RMS z-score against the training data;
          personal novelty is the same against a running model of this wearer.
          Either above 3 raises a flag instead of a confident answer.
        </p>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  frac,
  mark,
  warn,
}: {
  label: string;
  value: string;
  frac: number;
  mark?: number;
  warn?: boolean;
}) {
  return (
    <div>
      <dt className="flex justify-between text-[15px] font-semibold">
        <span>{label}</span>
        <span
          className={`os-mono font-normal ${warn ? "text-(--os-alert)" : ""}`}
        >
          {value}
          {warn ? " · flagged" : ""}
        </span>
      </dt>
      <dd className="os-meter mt-2">
        <i
          style={{
            transform: `scaleX(${Math.min(1, frac)})`,
            background: warn ? "var(--os-alert)" : undefined,
          }}
        />
        {mark !== undefined && (
          <b style={{ left: `${mark * 100}%` }} aria-hidden="true" />
        )}
      </dd>
    </div>
  );
}
