"use client";

import { useState } from "react";
import { s } from "./styles";

/** x/y: the wide layout (660 x 360). mx/my: a taller one for phones (340 x 390). */
const NODES = [
  { id: "heaps", label: "Lecture 14: Heaps", x: 300, y: 170, mx: 250, my: 200 },
  { id: "pq", label: "Priority queues", x: 160, y: 85, mx: 85, my: 120 },
  {
    id: "dijkstra",
    label: "Dijkstra's algorithm",
    x: 470,
    y: 80,
    mx: 245,
    my: 120,
  },
  { id: "trees", label: "Lecture 12: Trees", x: 150, y: 260, mx: 85, my: 280 },
  { id: "ps5", label: "PS 5", x: 300, y: 300, mx: 260, my: 360 },
  { id: "heapsort", label: "Heap sort", x: 470, y: 270, mx: 150, my: 360 },
  {
    id: "graphs",
    label: "Lecture 16: Graphs",
    x: 560,
    y: 175,
    mx: 250,
    my: 40,
  },
  { id: "bigo", label: "Big-O cheat sheet", x: 95, y: 170, mx: 85, my: 200 },
  { id: "lc207", label: "LeetCode 207", x: 600, y: 300, mx: 85, my: 40 },
];

const LAYOUTS = {
  wide: { w: 660, h: 360, cls: "hidden sm:block" },
  narrow: { w: 340, h: 390, cls: "sm:hidden" },
} as const;

/** made: links you wrote. found: connections Stack suggested. */
const EDGES: { a: string; b: string; found?: boolean }[] = [
  { a: "heaps", b: "pq" },
  { a: "heaps", b: "trees" },
  { a: "heaps", b: "ps5" },
  { a: "pq", b: "bigo" },
  { a: "graphs", b: "lc207" },
  { a: "heaps", b: "dijkstra", found: true },
  { a: "heaps", b: "heapsort", found: true },
  { a: "dijkstra", b: "graphs", found: true },
  { a: "trees", b: "bigo", found: true },
  { a: "heapsort", b: "ps5", found: true },
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

export function NoteGraph() {
  const [active, setActive] = useState<string>("heaps");
  const near = new Set(
    EDGES.flatMap((e) =>
      e.a === active ? [e.b] : e.b === active ? [e.a] : [],
    ),
  );
  const related = EDGES.filter((e) => e.a === active || e.b === active).map(
    (e) => ({ id: e.a === active ? e.b : e.a, found: !!e.found }),
  );

  return (
    <div className={s.graph} data-ui="">
      <div className={s.graphScroll}>
        {(["wide", "narrow"] as const).map((key) => {
          const L = LAYOUTS[key];
          const at = (n: (typeof NODES)[number]) =>
            key === "wide" ? { x: n.x, y: n.y } : { x: n.mx, y: n.my };
          // Only one layout is displayed at a time; the other is display:none,
          // so it is neither focusable nor in the accessibility tree.
          return (
            <svg
              key={key}
              viewBox={`0 0 ${L.w} ${L.h}`}
              className={`${L.cls} h-auto w-full`}
              role="group"
              aria-label="Graph of notes. Solid lines are links you made; dashed lines are connections Stack found."
            >
              {EDGES.map((e) => {
                const A = at(byId[e.a]);
                const B = at(byId[e.b]);
                const on = e.a === active || e.b === active;
                return (
                  <line
                    key={`${e.a}-${e.b}`}
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    className={`${e.found ? s.edgeFound : s.edgeMade} ${on ? s.edgeOn : ""}`}
                  />
                );
              })}
              {NODES.map((n) => {
                const isActive = n.id === active;
                const w = n.label.length * 7.4 + 22;
                const p = at(n);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${p.x} ${p.y})`}
                    className={`${s.node} ${isActive ? s.nodeActive : near.has(n.id) ? s.nodeNear : ""}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                    aria-label={n.label}
                    onMouseEnter={() => setActive(n.id)}
                    onFocus={() => setActive(n.id)}
                    onClick={() => setActive(n.id)}
                  >
                    <rect x={-w / 2} y={-15} width={w} height={30} rx={8} />
                    <text textAnchor="middle" dy="4.5">
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          );
        })}
      </div>
      <div className={s.related} aria-live="polite">
        <p>
          <strong>{byId[active].label}</strong> · related notes
        </p>
        <ul>
          {related.map((r) => (
            <li key={r.id}>
              <span
                aria-hidden="true"
                className={r.found ? s.keyFound : s.keyMade}
              />
              {byId[r.id].label}
              <span className={s.relKind}>
                {r.found ? "found by Stack" : "your link"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
