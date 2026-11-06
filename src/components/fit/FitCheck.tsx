"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FitIndex } from "@/lib/fit";
import { ROLES } from "@/lib/roles";
import {
  compileFit,
  FIT_HANDOFF_EVENT,
  FIT_HANDOFF_KEY,
  fitPrompt,
  fitMarks,
  fitRole,
  TAILOR_EVENT,
  fitSummary,
  matchFit,
} from "@/lib/fit-match";

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
  const taRef = useRef<HTMLTextAreaElement>(null);

  // A job description handed over from ayan-bot (pasted into the chat).
  useEffect(() => {
    try {
      const jd = sessionStorage.getItem(FIT_HANDOFF_KEY);
      if (jd) {
        sessionStorage.removeItem(FIT_HANDOFF_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time handoff from sessionStorage
        setText(jd.slice(0, 8000));
      }
    } catch {
      /* no storage */
    }
    const onFit = (e: Event) => {
      const jd = (e as CustomEvent<string>).detail;
      if (typeof jd !== "string") return;
      try {
        sessionStorage.removeItem(FIT_HANDOFF_KEY);
      } catch {
        /* ignore */
      }
      setText(jd.slice(0, 8000));
    };
    window.addEventListener(FIT_HANDOFF_EVENT, onFit);
    return () => window.removeEventListener(FIT_HANDOFF_EVENT, onFit);
  }, []);
  const jd = useDeferredValue(text);

  const compiled = useMemo(() => compileFit(index), [index]);
  const result = useMemo(
    () => (jd.trim().length < 20 ? null : matchFit(compiled, jd)),
    [jd, compiled],
  );
  const total = result?.total ?? 0;
  const role = result ? fitRole(result) : null;

  // The pasted text with each recognised phrase marked, so the score can be
  // checked against the posting itself.
  const marks = useMemo(
    () => (result ? fitMarks(compiled, jd) : []),
    [result, compiled, jd],
  );
  const annotated = useMemo(() => {
    const out: React.ReactNode[] = [];
    let at = 0;
    for (const m of marks) {
      if (m.start > at) out.push(jd.slice(at, m.start));
      out.push(
        <mark
          key={m.start}
          className={`cv-mark cv-mark-${m.kind}`}
          title={m.label}
        >
          {jd.slice(m.start, m.end)}
        </mark>,
      );
      at = m.end;
    }
    out.push(jd.slice(at));
    return out;
  }, [marks, jd]);

  // Announce the score once typing settles, not on every keystroke.
  const headline = !result
    ? ""
    : !total
      ? result.soft.length
        ? "No technical requirements recognised yet."
        : "No recognisable skills yet."
      : result.scored
        ? `${result.hits.length} of ${total} technical requirements backed by work on this site`
        : `${total} technical requirement${total === 1 ? "" : "s"} recognised, too few to score. Paste more of the role.`;
  const summary = headline ? `${headline}.`.replace(/\.\.$/, ".") : "";
  const [said, setSaid] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setSaid(summary), 700);
    return () => window.clearTimeout(t);
  }, [summary]);
  const roleLabel = role ? ROLES.find((r) => r.id === role)?.label : null;
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
        ref={taRef}
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
            onClick={() => {
              setText("");
              // The button unmounts; keep focus somewhere useful.
              taRef.current?.focus();
            }}
          >
            Clear
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {said}
      </p>
      <div className="mt-5">
        {result && total === 0 && result.soft.length === 0 && (
          <p className="text-muted">
            No recognisable skills yet. Paste more of the role (requirements,
            stack, responsibilities).
          </p>
        )}
        {result && (total > 0 || result.soft.length > 0) && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              {/* A market-style gauge: the arc sweeps to the share backed.
                  Only with enough technical requirements to mean something. */}
              {result.scored && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 84"
                  className="cv-gauge h-[84px] w-[120px] shrink-0"
                  style={{ "--p": pct } as React.CSSProperties}
                >
                  <path
                    d="M10 60 A50 50 0 0 1 110 60"
                    pathLength={100}
                    className="cv-gaugeTrack"
                  />
                  <path
                    d="M10 60 A50 50 0 0 1 110 60"
                    pathLength={100}
                    className="cv-gaugeFill"
                  />
                  <g className="cv-gaugeNeedle">
                    <line x1="60" y1="60" x2="60" y2="24" />
                    <circle cx="60" cy="60" r="3.5" />
                  </g>
                  <text
                    x="60"
                    y="81"
                    textAnchor="middle"
                    className="cv-gaugeNum"
                  >
                    {pct}%
                  </text>
                </svg>
              )}
              <p
                className={
                  result.scored
                    ? "text-fg max-w-[30ch] font-semibold"
                    : "text-muted"
                }
              >
                {headline}
              </p>
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
            {result.soft.length > 0 && (
              <p className="text-muted mt-4 text-[14px]">
                <span className="text-fg font-medium">Also, not scored: </span>
                {result.soft
                  .map(
                    (t) =>
                      `${t.label} (${t.evidence.map((e) => e.name).join(", ")})`,
                  )
                  .join("; ")}
                .
              </p>
            )}
            {result.gaps.length > 0 && (
              <p className="text-muted mt-4 text-[14px]">
                <span className="text-fg font-medium">
                  Not shown on this site:{" "}
                </span>
                {result.gaps.join(", ")}. Worth asking Ayan directly.
              </p>
            )}
            {marks.length > 0 && (
              <details className="cv-annotWrap mt-4">
                <summary className="t-label text-muted hover:text-fg min-h-9 cursor-pointer py-2">
                  Show what it recognised
                </summary>
                <p
                  className="cv-annot"
                  tabIndex={0}
                  aria-label="The job description, with recognised phrases marked"
                >
                  {annotated}
                </p>
                <p className="text-muted mt-2 flex flex-wrap gap-x-4 text-[12px]">
                  <span>
                    <mark className="cv-mark cv-mark-hit">backed</mark>
                  </span>
                  <span>
                    <mark className="cv-mark cv-mark-gap">not on the site</mark>
                  </span>
                  <span>
                    <mark className="cv-mark cv-mark-soft">not scored</mark>
                  </span>
                </p>
              </details>
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
                {role && roleLabel && (
                  <button
                    type="button"
                    className="pill min-h-10"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent(TAILOR_EVENT, { detail: role }),
                      );
                      const h = document.getElementById("cv-proj");
                      h?.scrollIntoView({ block: "start" });
                      h?.setAttribute("tabindex", "-1");
                      h?.focus({ preventScroll: true });
                    }}
                  >
                    Tailor this CV for {roleLabel}
                  </button>
                )}
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
