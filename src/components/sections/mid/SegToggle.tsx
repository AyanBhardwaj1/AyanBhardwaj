"use client";

import { useLayoutEffect, useRef, useState } from "react";
import "./mid.css";

/**
 * Segmented control. The selected state is a second, inverted copy of the
 * labels clipped to the active button (clip-path transitions), so the pill
 * slides between options with crisp text on both sides. Before it has
 * measured (SSR, first paint) the active button simply carries the fill.
 */
export function SegToggle({
  label,
  options,
  value,
  onChange,
  size = "sm",
  controls,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
  controls?: string;
}) {
  const h = size === "md" ? "min-h-9 px-4" : "min-h-8 px-3";
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
      className={`t-label border-line-strong inline-flex rounded-full border ${size === "md" ? "p-1" : "p-0.5"}`}
    >
      <div ref={rowRef} className="relative inline-flex">
        {options.map(([k, l]) => (
          <button
            key={k}
            type="button"
            data-k={k}
            aria-pressed={value === k}
            aria-controls={controls}
            onClick={() => onChange(k)}
            className={`md-seg ${h} rounded-full ${value === k ? (clip ? "text-fg" : "bg-fg text-bg") : "text-muted hover:text-fg"}`}
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
              <span key={k} className={`grid place-items-center ${h}`}>
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
