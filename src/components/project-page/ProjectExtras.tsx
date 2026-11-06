"use client";

import Link from "next/link";
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

export function readExplored(): string[] {
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

/**
 * "Worth asking about": three questions built from the project's own facts
 * (a metric, the stack choice, how it works), each opening ayan-bot, which
 * answers from the site's content.
 */
export function AskChips({
  name,
  stack,
  metrics,
}: {
  name: string;
  stack: string[];
  metrics: string[];
}) {
  // The most telling metric: a before → after, else a percentage or speed.
  const m =
    metrics.find((x) => x.includes("→")) ??
    metrics.find((x) => /%|ms\b|ns\b/.test(x)) ??
    null;
  const delta = m?.match(/^(.*?)\s*([\d.]+)\s*→\s*([\d.]+)$/);
  const picks = stack.filter((x) => !/^(TypeScript|JavaScript)$/.test(x));
  const qs = [
    delta
      ? `${name}: how did ${delta[1]} go from ${delta[2]} to ${delta[3]}?`
      : m
        ? `${name}: what's behind "${m}"?`
        : null,
    picks.length >= 2 ? `Why ${picks[0]} and ${picks[1]} for ${name}?` : null,
    `How does ${name} work, end to end?`,
  ].filter((q): q is string => Boolean(q));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="t-label text-muted mr-1">Worth asking about</span>
      {qs.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("ayan-bot:open", { detail: { prompt: q } }),
            )
          }
          className="border-line-strong hover:border-accent hover:text-accent min-h-9 rounded-full border px-3 text-left text-[13px] transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
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

export function Explored({
  slug,
  names,
}: {
  slug: ProjectSlug;
  /** Case-study names by slug (passed from the server; no content import). */
  names: Record<string, string>;
}) {
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
  // The next case study after this one (in page order) not yet opened.
  const at = PROJECT_PAGES.indexOf(slug);
  const order = [...PROJECT_PAGES.slice(at + 1), ...PROJECT_PAGES.slice(0, at)];
  const found = order.find((p) => !seen.includes(p));
  // The footer already links the next page; only point elsewhere.
  const nextId = found && found !== order[0] ? found : undefined;
  const nextUnseen = nextId ? { id: nextId, name: names[nextId] } : undefined;
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
      {!done && nextUnseen && (
        <Link
          href={`/projects/${nextUnseen.id}`}
          className="text-accent inline-flex min-h-9 items-center underline-offset-4 hover:underline"
        >
          Not yet seen: {nextUnseen.name} →
        </Link>
      )}
    </div>
  );
}

/**
 * Share this case study: the native share sheet where there is one (phones),
 * otherwise copy the link. The URL is the page's canonical address.
 */
export function ShareButton({ name, path }: { name: string; path: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = new URL(path, window.location.origin).href;
    const data = { title: `${name} · Ayan Bhardwaj`, url };
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* dismissed the sheet, or clipboard blocked */
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={share}
        className="t-label border-line-strong hover:border-accent hover:text-accent inline-flex h-10 items-center gap-2 rounded-full border px-3 transition-colors"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {done ? (
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          ) : (
            <>
              <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
              <path d="M5 13v5.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V13" />
            </>
          )}
        </svg>
        <span className="hidden lg:inline">
          {done ? "Link copied" : "Share"}
        </span>
        <span className="sr-only lg:hidden">
          {done ? "Link copied" : `Share ${name}`}
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {done ? "Link copied to the clipboard." : ""}
      </span>
    </>
  );
}
