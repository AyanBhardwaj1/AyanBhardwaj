"use client";

import { useState, type CSSProperties } from "react";
import "../sections/mid/mid.css";

export type ExperienceRow = {
  id: string;
  company: string;
  yc?: string;
  note?: string;
  role: string;
  dates: string;
  location: string;
  url?: string;
  summary: string;
  bullets: React.ReactNode[];
  tags: string[];
};

/**
 * Majd-style hairline rows. Click/Enter/Space expands (one open at a time);
 * the panel height animates via grid-template-rows 0fr → 1fr (no measuring),
 * its content fades up with a short bullet stagger, and the + turns into ×.
 * Hovering the list dims sibling rows (fine pointers only). Content stays in
 * screen-reader order; the toggle is a real button with aria-expanded and the
 * panel is a labelled region.
 */
export function ExperienceRows({
  rows,
  badges,
}: {
  rows: ExperienceRow[];
  badges: Record<string, React.ReactNode>;
}) {
  const [open, setOpen] = useState<string | null>(rows[0]?.id ?? null);
  return (
    <ul className="md-acc border-line border-t">
      {rows.map((r) => {
        const isOpen = open === r.id;
        return (
          <li
            key={r.id}
            id={`exp-${r.id}`}
            className="md-acc-row border-line border-b"
            data-open={isOpen}
          >
            <h3>
              <button
                type="button"
                id={`exp-btn-${r.id}`}
                aria-expanded={isOpen}
                aria-controls={`exp-panel-${r.id}`}
                onClick={() => setOpen(isOpen ? null : r.id)}
                className="md-acc-btn grid min-h-24 w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-2 py-5 text-left md:grid-cols-12 md:px-4"
              >
                <span className="flex flex-wrap items-center gap-3 md:col-span-5">
                  <span className="t-h3">{r.company}</span>
                  {badges[r.id]}
                </span>
                <span
                  aria-hidden="true"
                  className="md-acc-icon row-span-2 md:order-last md:col-span-1 md:row-span-1 md:justify-self-end"
                >
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <path
                      d="M6 1v10M1 6h10"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="text-muted md:col-span-3">{r.role}</span>
                <span className="t-data text-muted md:col-span-3 md:text-right">
                  {r.dates}
                </span>
              </button>
            </h3>
            <div
              id={`exp-panel-${r.id}`}
              role="region"
              aria-labelledby={`exp-btn-${r.id}`}
              className="md-acc-panel"
            >
              <div>
                <div className="md-acc-body grid gap-6 px-2 pb-8 md:grid-cols-12 md:px-4">
                  <div className="md:col-span-5">
                    <p className="text-muted max-w-[44ch]">{r.summary}</p>
                    <p className="t-data text-muted mt-4">
                      {r.location}
                      {r.url && (
                        <>
                          {" · "}
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link text-fg"
                          >
                            {r.url
                              .replace(/^https?:\/\/(www\.)?/, "")
                              .replace(/\/$/, "")}{" "}
                            ↗
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="md:col-span-7">
                    <ul className="space-y-3">
                      {r.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="md-acc-item text-muted flex gap-3"
                          style={{ "--i": i } as CSSProperties}
                        >
                          <span
                            aria-hidden="true"
                            className="text-accent pt-[0.1em]"
                          >
                            ›
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <ul
                      className="mt-6 flex flex-wrap gap-2"
                      aria-label="Stack"
                    >
                      {r.tags.map((t) => (
                        <li key={t} className="chip">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
