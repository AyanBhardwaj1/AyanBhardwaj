"use client";

import { useState } from "react";

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
 * Majd-style hairline rows. Click/Enter expands; hovering a row dims its
 * siblings and rotates the + (desktop). All content stays in the DOM order a
 * screen reader expects; the toggle is a real button with aria-expanded.
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
    <ul className="group/list border-line border-t">
      {rows.map((r) => {
        const isOpen = open === r.id;
        return (
          <li
            key={r.id}
            id={`exp-${r.id}`}
            className="border-line border-b transition-opacity duration-200 md:group-hover/list:opacity-40 md:focus-within:!opacity-100 md:hover:!opacity-100"
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`exp-panel-${r.id}`}
                onClick={() => setOpen(isOpen ? null : r.id)}
                className="group hover:bg-card grid min-h-24 w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-2 py-5 text-left transition-colors duration-200 md:grid-cols-12 md:px-4"
              >
                <span className="flex flex-wrap items-center gap-3 md:col-span-5">
                  <span className="t-h3">{r.company}</span>
                  {badges[r.id]}
                </span>
                <span
                  aria-hidden="true"
                  className={`border-line-strong row-span-2 grid size-8 place-items-center rounded-full border text-lg transition-transform duration-[240ms] md:order-last md:col-span-1 md:row-span-1 md:justify-self-end ${
                    isOpen ? "rotate-45" : "group-hover:rotate-45"
                  }`}
                >
                  +
                </span>
                <span className="text-muted md:col-span-3">{r.role}</span>
                <span className="t-data text-muted md:col-span-3 md:text-right">
                  {r.dates}
                </span>
              </button>
            </h3>
            <div
              id={`exp-panel-${r.id}`}
              className="collapsible"
              data-open={isOpen}
            >
              <div>
                <div className="grid gap-6 px-2 pb-8 md:grid-cols-12 md:px-4">
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
                        <li key={i} className="text-muted flex gap-3">
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
