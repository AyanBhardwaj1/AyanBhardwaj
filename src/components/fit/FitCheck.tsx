"use client";

import Link from "next/link";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { FitIndex } from "@/lib/fit";

/**
 * Paste a job description; see which of its requirements this site can back
 * up, with the projects and roles that show it, and which it can't. Runs
 * entirely in the browser: the text never leaves the page.
 */

const SAMPLE = `Software Engineer, AI Products (Fintech)
We're an early-stage startup building LLM agents for investment teams.
You'll ship full-stack features in TypeScript, React and Next.js, build
retrieval (RAG) over SEC filings, and work on Python data pipelines.
Bonus: Rust, quant/risk models, open-source contributions, Kubernetes.`;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function FitCheck({ index }: { index: FitIndex }) {
  const id = useId();
  const [text, setText] = useState("");
  const jd = useDeferredValue(text);

  const compiled = useMemo(
    () => ({
      terms: index.terms.map((t) => ({ ...t, re: new RegExp(t.jd, "i") })),
      missing: index.notOnSite.map((m) => ({
        label: m,
        // Short, ambiguous words ("Go") must match exactly, case-sensitively.
        re:
          m.length <= 3
            ? new RegExp(`(^|[^\\w.])${escape(m)}(?![\\w-])`)
            : new RegExp(`(^|[^\\w.])${escape(m)}(?![\\w])`, "i"),
      })),
    }),
    [index],
  );

  const result = useMemo(() => {
    if (jd.trim().length < 20) return null;
    const hits = compiled.terms.filter((t) => t.re.test(jd));
    const gaps = compiled.missing.filter((m) => m.re.test(jd));
    return { hits, gaps };
  }, [jd, compiled]);

  const total = result ? result.hits.length + result.gaps.length : 0;
  const pct =
    result && total ? Math.round((result.hits.length / total) * 100) : 0;

  const askBot = () => {
    if (!result) return;
    const top = result.hits
      .slice(0, 8)
      .map((h) => h.label)
      .join(", ");
    window.dispatchEvent(
      new CustomEvent("ayan-bot:open", {
        detail: {
          prompt:
            `A role asks for: ${top}. Where has Ayan done this work? Point me to the strongest examples.`.slice(
              0,
              480,
            ),
        },
      }),
    );
  };

  return (
    <section id="fit" aria-labelledby={`${id}-t`} className="cv-fit no-print">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-t`} className="cv-h2 !mt-0 !border-0">
          Fit check
        </h2>
        <p className="t-label text-muted">
          Runs in your browser · nothing is sent
        </p>
      </div>
      <label htmlFor={`${id}-jd`} className="text-muted mt-1 block text-[14px]">
        Paste a job description to see which requirements Ayan&apos;s work backs
        up, with evidence.
      </label>
      <textarea
        id={`${id}-jd`}
        name="job-description"
        rows={5}
        maxLength={8000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the role here…"
        spellCheck={false}
        className="border-line-strong bg-bg text-fg placeholder:text-dim focus-visible:border-accent mt-2 w-full resize-y rounded-[10px] border px-3 py-2 font-mono text-[13px] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40 focus-visible:outline-none"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="pill min-h-9 px-3 text-[12px]"
          onClick={() => setText(SAMPLE)}
        >
          Try a sample
        </button>
        {text && (
          <button
            type="button"
            className="pill min-h-9 px-3 text-[12px]"
            onClick={() => setText("")}
          >
            Clear
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {result
          ? total
            ? `${result.hits.length} of ${total} recognised requirements backed by work on this site.`
            : "No recognisable skills yet."
          : ""}
      </p>
      <div className="mt-5">
        {result && total === 0 && (
          <p className="text-muted">
            No recognisable skills yet. Paste more of the role (requirements,
            stack, responsibilities).
          </p>
        )}
        {result && total > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-fg font-semibold">
                {result.hits.length} of {total} recognised requirements backed
                by work on this site
              </p>
              <span
                aria-hidden="true"
                className="bg-line-strong relative h-1.5 w-40 overflow-hidden rounded-full"
              >
                <span
                  className="bg-accent absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </span>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {result.hits.map((h) => (
                <li
                  key={h.id}
                  className="border-line rounded-[10px] border p-3"
                >
                  <p className="font-medium">
                    <span aria-hidden="true" className="text-up">
                      ✓{" "}
                    </span>
                    {h.label}
                  </p>
                  <p className="text-muted mt-1 text-[13px]">
                    {h.evidence.map((e, i) => (
                      <span key={e.name}>
                        {i > 0 && " · "}
                        {e.href ? (
                          <Link href={e.href} className="link">
                            {e.name}
                          </Link>
                        ) : (
                          e.name
                        )}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
            {result.gaps.length > 0 && (
              <p className="text-muted mt-4 text-[14px]">
                <span className="text-fg font-medium">
                  Not shown on this site:{" "}
                </span>
                {result.gaps.map((g) => g.label).join(", ")}. Worth asking Ayan
                directly.
              </p>
            )}
            {result.hits.length > 0 && (
              <button
                type="button"
                onClick={askBot}
                className="pill pill-solid mt-4 min-h-10"
              >
                Ask ayan-bot for the strongest examples
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
