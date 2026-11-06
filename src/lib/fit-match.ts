import type { FitIndex, FitTerm } from "./fit";

/**
 * The browser half of the fit check: compile the server-built index once,
 * then match any pasted text against it. Shared by the web CV and /terminal.
 */

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type CompiledFit = {
  terms: (FitTerm & { re: RegExp })[];
  missing: { label: string; re: RegExp }[];
};

export type FitResult = {
  hits: FitTerm[];
  gaps: string[];
  total: number;
  pct: number;
};

export function compileFit(index: FitIndex): CompiledFit {
  return {
    terms: index.terms.map((t) => ({ ...t, re: new RegExp(t.jd, "i") })),
    missing: index.notOnSite.map((m) => ({
      label: m,
      // Short, ambiguous words ("Go") must match exactly, case-sensitively.
      // Names that start with a symbol (".NET") need no left boundary, so
      // "ASP.NET" still counts.
      re: new RegExp(
        `${/^\w/.test(m) ? "(?<![\\w.])" : ""}${escape(m)}(?![\\w${m.length <= 3 ? "-" : ""}])`,
        m.length <= 3 ? "" : "i",
      ),
    })),
  };
}

export function matchFit(c: CompiledFit, text: string): FitResult {
  const found = c.terms.filter((t) => t.re.test(text));
  const hits = found.filter((t) => t.evidence.length > 0);
  const gaps = [
    ...found.filter((t) => !t.evidence.length).map((t) => t.label),
    ...c.missing.filter((m) => m.re.test(text)).map((m) => m.label),
  ];
  const total = hits.length + gaps.length;
  return {
    hits,
    gaps,
    total,
    pct: total ? Math.round((hits.length / total) * 100) : 0,
  };
}

/** A ≤480-char prompt asking ayan-bot for the strongest examples. */
export function fitPrompt(r: FitResult): string {
  const top = r.hits
    .slice(0, 8)
    .map((h) => h.label)
    .join(", ");
  return `A role asks for: ${top}. Where has Ayan done this work? Point me to the strongest examples.`.slice(
    0,
    480,
  );
}

/** A plain-text summary to paste into notes, an ATS or a message. */
export function fitSummary(r: FitResult, url: string): string {
  return [
    `Ayan Bhardwaj: fit check (${url})`,
    `${r.hits.length} of ${r.total} recognised requirements backed by work on the site.`,
    "",
    ...r.hits.map(
      (h) => `+ ${h.label}: ${h.evidence.map((e) => e.name).join(", ")}`,
    ),
    ...(r.gaps.length
      ? ["", `Not shown on the site: ${r.gaps.join(", ")}`]
      : []),
  ].join("\n");
}

/** Where a job description waits while ayan-bot hands it to the Fit check. */
export const FIT_HANDOFF_KEY = "ayan:fit-jd";
export const FIT_HANDOFF_EVENT = "ayan:fit";

/** A long paste that reads like a role, not a question. */
export function looksLikeJobDescription(t: string): boolean {
  if (t.length < 300) return false;
  const cues = t.match(
    /responsibilit|requirements?\b|qualifications?|you will|you'll|we're looking|we are looking|years of|nice to have|about the role|what you('ll)? (do|bring)|preferred|benefits|equal opportunity/gi,
  );
  return (cues?.length ?? 0) >= 2;
}
