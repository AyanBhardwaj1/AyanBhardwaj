import type { FitIndex, FitTerm } from "./fit";

/**
 * The browser half of the fit check: compile the server-built index once,
 * then match any pasted text against it. Shared by the web CV and /terminal.
 */

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
    terms: index.terms.map((t) => ({
      ...t,
      re: new RegExp(t.jd, t.cs ? "" : "i"),
    })),
    // Built on the server (lib/fit); proper nouns, so case-sensitive.
    missing: index.notOnSite.map((m) => ({
      label: m.label,
      re: new RegExp(m.re),
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

/** Which CV lens a matched requirement points to (see lib/roles). */
const TERM_ROLE: Record<
  string,
  "ai" | "fintech" | "systems" | "fullstack" | "research"
> = {
  ml: "ai",
  dl: "ai",
  llm: "ai",
  rag: "ai",
  agents: "ai",
  cv: "ai",
  gnn: "ai",
  fintech: "fintech",
  quant: "fintech",
  valuation: "fintech",
  sec: "fintech",
  trading: "fintech",
  rust: "systems",
  cpp: "systems",
  wasm: "systems",
  desktop: "systems",
  perf: "systems",
  react: "fullstack",
  nextjs: "fullstack",
  node: "fullstack",
  api: "fullstack",
  frontend: "fullstack",
  fullstack: "fullstack",
  postgres: "fullstack",
  nlp: "research",
  evals: "research",
  scraping: "research",
};

/** The role a job description leans toward, or null if nothing stands out. */
export function fitRole(r: FitResult) {
  const n = new Map<string, number>();
  for (const h of r.hits) {
    const role = TERM_ROLE[h.id];
    if (role) n.set(role, (n.get(role) ?? 0) + 1);
  }
  // Ties go to the more specific lens; full-stack terms show up everywhere.
  const rank = ["ai", "fintech", "systems", "research", "fullstack"];
  const best = [...n.entries()].sort(
    (a, b) => b[1] - a[1] || rank.indexOf(a[0]) - rank.indexOf(b[0]),
  )[0];
  return best && best[1] >= 2 ? (best[0] as (typeof TERM_ROLE)[string]) : null;
}

/** FitCheck -> CvTailor: "tailor the CV for this role". */
export const TAILOR_EVENT = "ayan:tailor";
