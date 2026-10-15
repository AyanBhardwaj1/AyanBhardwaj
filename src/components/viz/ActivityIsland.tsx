"use client";

import { useEffect, useRef, useState } from "react";
import {
  HeatGrid,
  IsoSkyline,
  MonthlyBars,
  type CompactRange,
} from "./contrib-svg";

/** Range × view switcher for the contribution surface. Data is compact; SVG renders here. */
export function ActivityIsland({ ranges }: { ranges: CompactRange[] }) {
  const [key, setKey] = useState(ranges[0]?.key);
  const [view, setView] = useState<"surface" | "grid">("surface");
  const gridRef = useRef<HTMLDivElement>(null);
  const r = ranges.find((x) => x.key === key) ?? ranges[0];

  // Mobile: the grid scrolls inside its own container; start at the most recent weeks.
  useEffect(() => {
    const el = gridRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [view, key]);

  const first = r.monthly.slice(-12, -6).reduce((s, m) => s + m.total, 0);
  const second = r.monthly.slice(-6).reduce((s, m) => s + m.total, 0);

  return (
    <div>
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
        {view === "surface" ? (
          <div className="mx-auto max-w-4xl">
            <IsoSkyline range={r} />
          </div>
        ) : (
          <div>
            <div ref={gridRef} className="overflow-x-auto pb-2">
              <HeatGrid range={r} />
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
        )}
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
              <dd className="text-fg mt-1 text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="t-data">
          <p className="t-label text-muted mb-2">Monthly · last 12</p>
          <MonthlyBars monthly={r.monthly} />
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
  return (
    <div
      role="group"
      aria-label={label}
      className="t-label border-line-strong inline-flex rounded-full border p-0.5"
    >
      {options.map(([k, l]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={`min-h-8 rounded-full px-3 ${value === k ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
