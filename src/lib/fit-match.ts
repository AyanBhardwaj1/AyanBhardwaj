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
      re:
        m.length <= 3
          ? new RegExp(`(^|[^\\w.])${escape(m)}(?![\\w-])`)
          : new RegExp(`(^|[^\\w.])${escape(m)}(?![\\w])`, "i"),
    })),
  };
}

export function matchFit(c: CompiledFit, text: string): FitResult {
  const hits = c.terms.filter((t) => t.re.test(text));
  const gaps = c.missing.filter((m) => m.re.test(text)).map((m) => m.label);
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
