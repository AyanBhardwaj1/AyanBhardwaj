"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "../sections/mid/mid.css";
import {
  HeatGrid,
  IsoSkyline,
  MonthlyBars,
  type CompactRange,
} from "./contrib-svg";

/**
 * Range × view switcher for the contribution surface. Data is compact; SVG
 * renders here. Both views share one grid cell, so switching crossfades with
 * no height jump; bars rise in a left-to-right wave the first time the island
 * scrolls into view and again on each range change (keyed remount).
 */
export function ActivityIsland({ ranges }: { ranges: CompactRange[] }) {
  const [key, setKey] = useState(ranges[0]?.key);
  const [view, setView] = useState<"surface" | "grid">("surface");
  const gridRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const r = ranges.find((x) => x.key === key) ?? ranges[0];

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-run");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-run");
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mobile: the grid scrolls inside its own container; start at the most recent weeks.
  useEffect(() => {
    const el = gridRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [view, key]);

  const first = r.monthly.slice(-12, -6).reduce((s, m) => s + m.total, 0);
  const second = r.monthly.slice(-6).reduce((s, m) => s + m.total, 0);

  return (
    <div ref={rootRef} className="md-act">
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="t-data flex items-center gap-3">
          <span className="text-accent">AYAN-GH</span>
          <span className="text-muted">Contribution surface</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Seg
            label="Range"
            options={ranges.map((x) => [x.key, x.label])}
            value={key}
            onChange={setKey}
          />
          <Seg
            label="View"
            options={[
              ["surface", "Surface"],
              ["grid", "Grid"],
            ]}
            value={view}
            onChange={(v) => setView(v as "surface" | "grid")}
          />
        </div>
      </div>
      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="md-views">
          <div
            className="md-view mx-auto w-full max-w-4xl"
            data-active={view === "surface"}
            inert={view !== "surface"}
          >
            <IsoSkyline key={r.key} range={r} />
          </div>
          <div
            className="md-view self-center"
            data-active={view === "grid"}
            inert={view !== "grid"}
          >
            <div ref={gridRef} className="overflow-x-auto pb-2">
              <HeatGrid key={r.key} range={r} />
            </div>
            <div
              className="t-label text-muted mt-3 flex items-center justify-end gap-1.5"
              aria-hidden="true"
            >
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span
                  key={l}
                  className="size-[11px] rounded-[2px]"
                  style={{ background: `var(--heat-${l})` }}
                />
              ))}
              More
            </div>
          </div>
        </div>
        <table className="sr-only">
          <caption>Monthly contributions, {r.label}</caption>
          <tbody>
            {r.monthly.map((m) => (
              <tr key={m.month}>
                <th scope="row">{m.month}</th>
                <td>{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-line grid gap-6 border-t px-4 py-5 md:grid-cols-[1fr_auto] md:items-end md:px-6">
        <dl className="t-data grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {r.stats.map(([k, v]) => (
            <div key={k}>
              <dt className="t-label text-muted">{k}</dt>
              <dd
                key={`${r.key}-${v}`}
                className="md-swap text-fg mt-1 text-[15px]"
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <div className="t-data">
          <p className="t-label text-muted mb-2">Monthly · last 12</p>
          <MonthlyBars key={r.key} monthly={r.monthly} />
          {second > first && (
            <p className="text-up mt-2">
              ▲ {first} → {second}{" "}
              <span className="text-muted">half over half</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Segmented control. The selected state is a second, inverted copy of the
 * labels clipped to the active button (clip-path transitions), so the pill
 * slides between options with crisp text on both sides. Before it has
 * measured (SSR, first paint) the active button simply carries the fill.
 */
function Seg({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<string | null>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const btn = row.querySelector<HTMLElement>(`[data-k="${value}"]`);
      if (!btn) return;
      const w = row.offsetWidth;
      const l = btn.offsetLeft;
      const rgt = w - l - btn.offsetWidth;
      setClip(`inset(0 ${rgt}px 0 ${l}px round 999px)`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div
      role="group"
      aria-label={label}
      className="t-label border-line-strong inline-flex rounded-full border p-0.5"
    >
      <div ref={rowRef} className="relative inline-flex">
        {options.map(([k, l]) => (
          <button
            key={k}
            type="button"
            data-k={k}
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className={`md-seg min-h-8 rounded-full px-3 ${value === k ? (clip ? "text-fg" : "bg-fg text-bg") : "text-muted hover:text-fg"}`}
          >
            {l}
          </button>
        ))}
        {clip && (
          <div
            aria-hidden="true"
            className="md-seg-fill bg-fg text-bg pointer-events-none absolute inset-0 inline-flex rounded-full normal-case"
            style={{ clipPath: clip }}
          >
            {options.map(([k, l]) => (
              <span key={k} className="grid min-h-8 place-items-center px-3">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
