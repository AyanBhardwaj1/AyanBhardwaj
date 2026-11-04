"use client";

import { useEffect, useRef, useState } from "react";
import { s } from "./styles";

const NODES = [
  { id: "heaps", label: "Lecture 14: Heaps", x: 300, y: 170 },
  { id: "pq", label: "Priority queues", x: 160, y: 85 },
  { id: "dijkstra", label: "Dijkstra's algorithm", x: 470, y: 80 },
  { id: "trees", label: "Lecture 12: Trees", x: 150, y: 260 },
  { id: "ps5", label: "PS 5", x: 300, y: 300 },
  { id: "heapsort", label: "Heap sort", x: 470, y: 270 },
  { id: "graphs", label: "Lecture 16: Graphs", x: 560, y: 175 },
  { id: "bigo", label: "Big-O cheat sheet", x: 95, y: 170 },
  { id: "lc207", label: "LeetCode 207", x: 600, y: 300 },
];

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
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens the graph scrolls sideways; start centred on the
  // lecture note instead of its left edge.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth)
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);
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
      <div ref={scroller} className={s.graphScroll}>
        <svg
          viewBox="0 0 660 360"
          className="block h-auto w-full min-w-[560px]"
          role="group"
          aria-label="Graph of notes. Solid lines are links you made; dashed lines are connections Stack found."
        >
          {EDGES.map((e, i) => {
            const A = byId[e.a];
            const B = byId[e.b];
            const on = e.a === active || e.b === active;
            return (
              <line
                key={`${e.a}-${e.b}`}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                className={`${e.found ? s.edgeFound : s.edgeMade} ${on ? s.edgeOn : ""}`}
                style={{ "--i": i } as React.CSSProperties}
              />
            );
          })}
          {NODES.map((n, i) => {
            const isActive = n.id === active;
            const w = n.label.length * 7.4 + 22;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                className={`${s.node} ${isActive ? s.nodeActive : near.has(n.id) ? s.nodeNear : ""}`}
                style={{ "--i": i } as React.CSSProperties}
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
