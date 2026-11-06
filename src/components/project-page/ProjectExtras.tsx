"use client";

import { useEffect, useState } from "react";
import {
  PROJECT_PAGES,
  hasProjectPage,
  type ProjectSlug,
} from "@/lib/projects";

/**
 * Small client islands for the project shell:
 * - AskAboutButton: opens ayan-bot with a question about this project
 *   (the bot already knows which page it's on).
 * - Explored: remembers which case studies this browser has opened (local
 *   storage only, never sent anywhere) and shows "n of 7 explored". Opening
 *   the last one rings the closing bell once.
 */

const KEY = "ayan:explored";

function readExplored(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return [];
    // Known project slugs only, each once.
    return [
      ...new Set(
        arr.filter(
          (x): x is string => typeof x === "string" && hasProjectPage(x),
        ),
      ),
    ];
  } catch {
    return [];
  }
}

export function AskAboutButton({ name }: { name: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("ayan-bot:open", {
            detail: { prompt: `How does ${name} work, and what's the stack?` },
          }),
        )
      }
      className="t-label border-line-strong hover:border-accent hover:text-accent inline-flex h-10 items-center gap-2 rounded-full border px-3 transition-colors"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z" />
      </svg>
      <span className="hidden md:inline">Ask about {name}</span>
      <span className="sr-only md:hidden">Ask ayan-bot about {name}</span>
    </button>
  );
}

export function Explored({ slug }: { slug: ProjectSlug }) {
  const [seen, setSeen] = useState<string[] | null>(null);

  useEffect(() => {
    const prev = readExplored();
    const next = prev.includes(slug) ? prev : [...prev, slug];
    const total = PROJECT_PAGES.length;
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* private mode: just don't remember */
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only storage after mount
    setSeen(next);
    if (next.length === total && prev.length === total - 1) {
      // Just completed the set. Save it together with the bell, so leaving
      // the page early can't record completion without ever ringing.
      const t = window.setTimeout(() => {
        save();
        void import("@/components/fx/eggs").then((m) => m.bell());
      }, 900);
      return () => window.clearTimeout(t);
    }
    save();
  }, [slug]);

  if (!seen) return null;
  const total = PROJECT_PAGES.length;
  const done = seen.length >= total;
  return (
    <div className="t-label text-muted flex flex-wrap items-center gap-3">
      <span aria-hidden="true" className="flex gap-1">
        {PROJECT_PAGES.map((p) => (
          <span
            key={p}
            className={`h-1.5 w-4 rounded-full ${seen.includes(p) ? "bg-accent" : "bg-[var(--line-strong)]"}`}
          />
        ))}
      </span>
      <span>
        {done
          ? `All ${total} case studies explored. Ayan says thanks.`
          : `${seen.length} of ${total} case studies explored`}
      </span>
    </div>
  );
}
