"use client";

import Link from "next/link";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { FitIndex } from "@/lib/fit";
import { compileFit, fitPrompt, fitSummary, matchFit } from "@/lib/fit-match";

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

export function FitCheck({ index }: { index: FitIndex }) {
  const id = useId();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const jd = useDeferredValue(text);

  const compiled = useMemo(() => compileFit(index), [index]);
  const result = useMemo(
    () => (jd.trim().length < 20 ? null : matchFit(compiled, jd)),
    [jd, compiled],
  );
  const total = result?.total ?? 0;
  const pct = result?.pct ?? 0;

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        fitSummary(result, `${window.location.origin}/cv#fit`),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const askBot = () => {
    if (!result) return;
    window.dispatchEvent(
      new CustomEvent("ayan-bot:open", {
        detail: { prompt: fitPrompt(result) },
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
                  className="cv-fitBar bg-accent absolute inset-0 rounded-full"
                  style={{ "--p": pct / 100 } as React.CSSProperties}
                />
              </span>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {result.hits.map((h, i) => (
                <li
                  key={h.id}
                  className="cv-fitCard border-line rounded-[10px] border p-3"
                  style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
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
                {result.gaps.join(", ")}. Worth asking Ayan directly.
              </p>
            )}
            {result.hits.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={askBot}
                  className="pill pill-solid min-h-10"
                >
                  Ask ayan-bot for the strongest examples
                </button>
                <button type="button" onClick={copy} className="pill min-h-10">
                  {copied ? "Copied" : "Copy summary"}
                </button>
                <span className="sr-only" aria-live="polite">
                  {copied ? "Fit summary copied to the clipboard." : ""}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
