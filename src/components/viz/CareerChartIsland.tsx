"use client";

import { useId, useMemo, useState } from "react";

export type ChartPoint = {
  x: number;
  y: number;
  month: string;
  value: number;
  event?: { ticker: string; title: string; detail: string; kind: string };
};

/**
 * Crosshair that follows the pointer (snapping to the nearest month) or the
 * arrow keys (snapping to events). The readout is aria-live; the SVG itself is
 * decorative because the event list is rendered as text alongside.
 */
export function CareerChartIsland({
  points,
  width,
  height,
  grid,
  years,
  padRight,
}: {
  points: ChartPoint[];
  width: number;
  height: number;
  grid: { y: number; label: string }[];
  years: { x: number; label: string }[];
  padRight: number;
}) {
  const id = useId();
  const events = useMemo(
    () => points.map((p, i) => (p.event ? i : -1)).filter((i) => i >= 0),
    [points],
  );
  const [active, setActive] = useState<number>(
    events.at(-1) ?? points.length - 1,
  );
  const p = points[active];
  const line = points
    .map((pt, i) => `${i ? "L" : "M"}${pt.x} ${pt.y}`)
    .join("");
  const area = `${line}L${points.at(-1)!.x} ${height - 32}L${points[0].x} ${height - 32}Z`;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    for (let i = 1; i < points.length; i++)
      if (Math.abs(points[i].x - sx) < Math.abs(points[best].x - sx)) best = i;
    setActive(best);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next =
        e.key === "ArrowRight"
          ? (events.find((i) => i > active) ?? events[0])
          : ([...events].reverse().find((i) => i < active) ?? events.at(-1)!);
      setActive(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(events[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(events.at(-1)!);
    }
  }

  return (
    <div className="relative">
      <div
        tabIndex={0}
        role="group"
        aria-roledescription="chart"
        aria-label="AYAN index career chart. Use left and right arrow keys to move between events."
        aria-describedby={`${id}-readout`}
        onKeyDown={onKey}
        className="overflow-x-auto px-2 pt-4 outline-offset-[-4px] md:px-4"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[640px] touch-pan-y"
          onPointerMove={onMove}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid.map((g) => (
            <g key={g.label}>
              <line
                x1="0"
                x2={width - padRight + 8}
                y1={g.y}
                y2={g.y}
                stroke="var(--line)"
              />
              <text
                x={width - padRight + 14}
                y={g.y + 4}
                className="fill-[var(--fg-muted)] font-mono text-[11px]"
              >
                {g.label}
              </text>
            </g>
          ))}
          {years.map((yr) => (
            <text
              key={yr.label}
              x={yr.x}
              y={height - 10}
              className="fill-[var(--fg-muted)] font-mono text-[11px]"
            >
              {yr.label}
            </text>
          ))}
          <path d={area} fill={`url(#${id}-fill)`} />
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {points.map((pt, i) =>
            pt.event ? (
              <g
                key={i}
                className="cursor-pointer"
                onPointerEnter={() => setActive(i)}
              >
                <line
                  x1={pt.x}
                  x2={pt.x}
                  y1={pt.y - 10}
                  y2={pt.y - 26}
                  stroke="var(--line-strong)"
                />
                <rect
                  x={pt.x - 18}
                  y={pt.y - 44}
                  width="36"
                  height="18"
                  rx="3"
                  fill="var(--bg-elev)"
                  stroke="var(--line-strong)"
                />
                <text
                  x={pt.x}
                  y={pt.y - 31}
                  textAnchor="middle"
                  className="fill-[var(--fg)] font-mono text-[10px]"
                >
                  {pt.event.ticker}
                </text>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="var(--bg)"
                  stroke="var(--accent)"
                  strokeWidth="1.75"
                />
              </g>
            ) : null,
          )}
          <line
            x1={p.x}
            x2={p.x}
            y1="12"
            y2={height - 32}
            stroke="var(--fg-muted)"
            strokeDasharray="2 3"
          />
          <line
            x1="0"
            x2={width - padRight + 8}
            y1={p.y}
            y2={p.y}
            stroke="var(--fg-muted)"
            strokeDasharray="2 3"
            opacity=".5"
          />
          <circle cx={p.x} cy={p.y} r="5.5" fill="var(--accent)" />
        </svg>
      </div>
      <div
        id={`${id}-readout`}
        aria-live="polite"
        className="t-data flex min-h-16 flex-wrap items-baseline gap-x-4 gap-y-1 px-4 pb-4 md:px-6"
      >
        <span className="text-muted">{p.month}</span>
        <span className="tabular-nums">{p.value.toFixed(1)}</span>
        {p.event ? (
          <span className="basis-full font-sans text-[15px] md:basis-auto">
            <span className="text-accent">{p.event.ticker}</span>{" "}
            {p.event.title}.{" "}
            <span className="text-muted">{p.event.detail}</span>
          </span>
        ) : (
          <span className="text-muted">no event · drift</span>
        )}
      </div>
    </div>
  );
}
