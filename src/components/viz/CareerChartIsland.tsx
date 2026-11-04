"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "../sections/mid/mid.css";

export type ChartPoint = {
  x: number;
  y: number;
  month: string;
  value: number;
  event?: { ticker: string; title: string; detail: string; kind: string };
};

/**
 * The SVG carries only the line, area and grid (stretched to the box with
 * non-scaling strokes), so the chart fills a phone screen without a sideways
 * scroll. Labels, flags, the crosshair and the tooltip are HTML positioned in
 * percentages, so text stays crisp and readable at any width. The crosshair
 * moves with transforms (eased), snapping to the nearest month under the
 * pointer or finger; the arrow keys step between events. The readout is
 * aria-live; the plot itself is decorative because the event list is also
 * rendered as text. The line wipes in once when it first scrolls into view.
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
  const ref = useRef<HTMLDivElement>(null);
  const events = useMemo(
    () => points.map((p, i) => (p.event ? i : -1)).filter((i) => i >= 0),
    [points],
  );
  const [active, setActive] = useState<number>(
    events.at(-1) ?? points.length - 1,
  );
  const p = points[active];
  const base = height - 32;
  const line = points
    .map((pt, i) => `${i ? "L" : "M"}${pt.x} ${pt.y}`)
    .join("");
  const area = `${line}L${points.at(-1)!.x} ${base}L${points[0].x} ${base}Z`;
  const px = (x: number) => (x / width) * 100;
  const py = (y: number) => (y / height) * 100;
  const plotRight = width - padRight + 8;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-drawn");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-drawn");
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function pick(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    for (let i = 1; i < points.length; i++)
      if (Math.abs(points[i].x - sx) < Math.abs(points[best].x - sx)) best = i;
    if (best !== active) setActive(best);
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

  const tipLeft = px(p.x) > 62;

  return (
    <div className="relative">
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-roledescription="chart"
        aria-label="AYAN index career chart. Use left and right arrow keys to move between events."
        aria-describedby={`${id}-readout`}
        onKeyDown={onKey}
        className="md-chart px-2 pt-4 md:px-4"
      >
        <div
          className="md-chart-box"
          style={{ "--ar": `${width} / ${height}` } as CSSProperties}
          onPointerMove={pick}
          onPointerDown={pick}
          aria-hidden="true"
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {grid.map((g) => (
              <line
                key={g.label}
                x1="0"
                x2={plotRight}
                y1={g.y}
                y2={g.y}
                stroke="var(--line)"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <g className="md-chart-plot">
              <path d={area} fill={`url(#${id}-fill)`} />
              <path
                d={line}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.75"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>

          {grid.map((g) => (
            <span
              key={g.label}
              className="md-chart-ylabel"
              style={{ top: `${py(g.y)}%` }}
            >
              {g.label}
            </span>
          ))}
          {years.map((yr) => (
            <span
              key={yr.label}
              className="md-chart-xlabel"
              style={{ left: `${px(yr.x)}%` }}
            >
              {yr.label}
            </span>
          ))}

          {points.map((pt, i) =>
            pt.event ? (
              <span
                key={i}
                className={`md-chart-flag ${i === active ? "is-active" : ""}`}
                style={
                  {
                    left: `${px(pt.x)}%`,
                    top: `${py(pt.y)}%`,
                    "--d": `${Math.round((pt.x / width) * 1100)}ms`,
                  } as CSSProperties
                }
              >
                <span className="md-chart-tag">{pt.event.ticker}</span>
                <span className="md-chart-dot" />
              </span>
            ) : null,
          )}

          {/* Crosshair: full-box layers translated by percentages (transform only). */}
          <span
            className="md-chart-cross md-chart-vx"
            style={{ transform: `translateX(${px(p.x)}%)` }}
          />
          <span
            className="md-chart-cross md-chart-hy"
            style={{
              transform: `translateY(${py(p.y)}%)`,
              width: `${px(plotRight)}%`,
            }}
          />
          <span
            className="md-chart-cross md-chart-pt"
            style={{ transform: `translate(${px(p.x)}%, ${py(p.y)}%)` }}
          >
            <span className="md-chart-knob" />
            <span
              className={`md-chart-tip t-data ${tipLeft ? "is-left" : ""} ${py(p.y) > 72 ? "is-above" : ""}`}
            >
              <span className="text-muted">{p.month}</span>{" "}
              <span className="text-fg">{p.value.toFixed(1)}</span>
              {p.event && (
                <span className="text-accent"> {p.event.ticker}</span>
              )}
            </span>
          </span>
        </div>
      </div>
      <div
        id={`${id}-readout`}
        aria-live="polite"
        className="t-data flex min-h-20 flex-wrap items-baseline gap-x-4 gap-y-1 px-4 pt-3 pb-4 md:min-h-16 md:px-6"
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
