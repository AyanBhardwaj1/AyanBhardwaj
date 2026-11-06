// Unit tests for the Fit check, against the real vocabulary in
// src/lib/fit-terms.ts. Run: npm run test:unit (Node's test runner with type
// stripping; no build). Evidence is faked: every term is "backed" except Java.
import assert from "node:assert/strict";
import { test } from "node:test";
import { gapPattern, NOT_ON_SITE, TERMS } from "../../src/lib/fit-terms.ts";
import {
  compileFit,
  decodeFit,
  encodeFit,
  fitMarks,
  fitRole,
  fitSummary,
  looksLikeJobDescription,
  matchFit,
} from "../../src/lib/fit-match.ts";

const index = {
  terms: TERMS.map((t) => ({
    id: t.id,
    label: t.label,
    jd: t.jd,
    ...(t.cs ? { cs: true } : {}),
    ...(t.soft ? { soft: true } : {}),
    evidence: t.id === "java" ? [] : [{ name: `ev-${t.id}`, href: null }],
  })),
  notOnSite: NOT_ON_SITE.map((m) =>
    typeof m === "string" ? { label: m, re: gapPattern(m) } : m,
  ),
};
const c = compileFit(index);
const run = (t: string) => {
  const r = matchFit(c, t);
  return { hits: r.hits.map((h) => h.label), gaps: r.gaps, r };
};

test("a sales job ad scores nothing", () => {
  const { hits, gaps } = run(
    "Account Executive. Join a fast-paced team and take ownership of your pipeline alongside the rest of the go-to-market team. Grow our customer base, track performance against quota, protect our brand image. Philanthropic giving program. Annual performance evaluation. Work autonomously; be a change agent. We partner with an executive search firm. Quantities of leads. Go above and beyond! Swift follow-up and guard rails. Apply: jobs@acme.net",
  );
  assert.deepEqual(hits, []);
  assert.deepEqual(gaps, []);
});

test("Next.js does not imply JavaScript", () => {
  assert.ok(!run("Next.js and Node.js").hits.includes("JavaScript"));
  assert.ok(run("plain JS").hits.includes("JavaScript"));
});

test("a term with no evidence is a gap, not silently dropped", () => {
  const { hits, gaps } = run("Java developer with Python");
  assert.deepEqual(hits, ["Python"]);
  assert.ok(gaps.includes("Java"));
});

test("SEC is the regulator, not ops/sec", () => {
  assert.ok(run("parse SEC filings").hits.includes("SEC / EDGAR / XBRL"));
  assert.ok(
    !run("1M ops/sec, every second").hits.includes("SEC / EDGAR / XBRL"),
  );
});

test("gaps are proper nouns in context", () => {
  assert.deepEqual(run("Go above and beyond").gaps, []);
  assert.deepEqual(run("Rust, Go, Python").gaps, ["Go"]);
  assert.deepEqual(run("Go services on Kubernetes").gaps, ["Kubernetes", "Go"]);
  assert.deepEqual(run("Golang").gaps, ["Go"]);
  assert.deepEqual(run("swift follow-ups").gaps, []);
  assert.deepEqual(run("iOS in Swift, SwiftUI").gaps, ["Swift", "iOS"]);
  assert.deepEqual(run("Ruby on Rails").gaps, ["Ruby", "Rails"]);
  assert.deepEqual(run("guard Rails of the road").gaps, []);
  assert.deepEqual(run("ASP.NET Core and C#").gaps, ["C#", ".NET"]);
  assert.deepEqual(run("mail jobs@acme.net").gaps, []);
  assert.deepEqual(run("Vue.js frontends").gaps, ["Vue"]);
});

test("technical context required for soft-looking terms", () => {
  assert.ok(!run("the rest of the team").hits.includes("APIs / backend"));
  assert.ok(run("RESTful APIs").hits.includes("APIs / backend"));
  assert.ok(!run("change agents").hits.includes("AI agents"));
  assert.ok(run("LLM agents with tool use").hits.includes("AI agents"));
  assert.ok(
    !run("executive search firm").hits.includes("Retrieval / RAG / search"),
  );
  assert.ok(
    run("search ranking and embeddings").hits.includes(
      "Retrieval / RAG / search",
    ),
  );
});

test("percent and totals", () => {
  const { r } = run("Python, LLMs and Kubernetes");
  assert.equal(r.total, 3);
  assert.equal(r.pct, 67);
});

test("fitRole needs two signals and prefers the specific lens on ties", () => {
  assert.equal(fitRole(matchFit(c, "Python only")), null);
  assert.equal(fitRole(matchFit(c, "LLMs and RAG")), "ai");
  assert.equal(fitRole(matchFit(c, "LLMs, RAG, React, Next.js")), "ai");
  assert.equal(fitRole(matchFit(c, "React, Next.js, Node.js")), "fullstack");
});

test("summary lists hits with evidence and the gaps", () => {
  const s = fitSummary(
    matchFit(c, "Python, React, Rust and Kubernetes"),
    "https://x/cv#fit",
  );
  assert.match(s, /3 of 4 technical requirements backed/);
  assert.match(s, /\+ Python: ev-python/);
  assert.match(s, /Not shown on the site: Kubernetes/);
});

test("job description detection", () => {
  assert.equal(looksLikeJobDescription("What did Ayan build at Moss?"), false);
  const jd =
    "About the role: we're looking for an engineer. Responsibilities: build things. ".repeat(
      5,
    ) + "Requirements: 3+ years of Python.";
  assert.equal(looksLikeJobDescription(jd), true);
});

test("8,000 characters of adversarial text match quickly", () => {
  for (const nasty of [
    "a".repeat(4000) + ".".repeat(4000),
    "Go ".repeat(2600),
    ", ".repeat(4000),
  ]) {
    const t0 = performance.now();
    matchFit(c, nasty);
    assert.ok(performance.now() - t0 < 200);
  }
});

test("non-tech postings don't score (QA cases)", () => {
  const ae = run(
    "Account Executive: you'll sell cloud software and payments solutions. Startup experience and leadership in a team setting are a plus. Beat benchmarks every quarter. Our UI makes demos easy.",
  );
  assert.deepEqual(ae.hits, []);
  assert.equal(ae.r.scored, false);
  assert.deepEqual(
    ae.r.soft.map((t) => t.label),
    ["Startup experience", "Leadership"],
  );
  const pm = run(
    "Product Manager, Payments: own our API products, partner with engineering, SQL a plus, leadership required.",
  );
  assert.equal(pm.r.scored, false);
  const rn = run(
    "Registered Nurse. Cloud-based patient records. Night shifts.",
  );
  assert.deepEqual(rn.hits, []);
});

test("soft matches are listed but never scored", () => {
  const { r } = run("Python, React and Rust at an early-stage startup");
  assert.equal(r.total, 3);
  assert.equal(r.pct, 100);
  assert.deepEqual(
    r.soft.map((t) => t.label),
    ["Startup experience"],
  );
});

test("data-science wording", () => {
  const ds = run(
    "Data Scientist: Python, SQL, scikit-learn, XGBoost, Tableau, Spark or Databricks; quantitative background.",
  );
  assert.ok(ds.hits.includes("Machine learning"));
  assert.ok(!ds.hits.includes("Quant / risk models"));
  for (const g of ["XGBoost", "Tableau", "Apache Spark", "Databricks"])
    assert.ok(ds.gaps.includes(g), g);
  assert.ok(!run("Meta's Muse Spark plans it").gaps.includes("Apache Spark"));
});

test("marks point at the recognised phrases, without overlaps", () => {
  const text = "Python and React at an early-stage startup; Kubernetes a plus.";
  const marks = fitMarks(c, text);
  const got = marks.map((m) => [text.slice(m.start, m.end), m.kind]);
  assert.deepEqual(got, [
    ["Python", "hit"],
    ["React", "hit"],
    ["early-stage", "soft"],
    ["startup", "soft"],
    ["Kubernetes", "gap"],
  ]);
  for (let i = 1; i < marks.length; i++)
    assert.ok(marks[i].start >= marks[i - 1].end);
});

test("every counted requirement is marked somewhere (overlaps merge)", () => {
  for (const text of [
    "Postgres and low latency trading systems",
    "LLM evaluations, ML benchmarks and Graph neural networks",
    "Python, React, early-stage startup, Kubernetes, ASP.NET",
  ]) {
    const r = matchFit(c, text);
    const marked = new Set(fitMarks(c, text).flatMap((m) => m.labels));
    for (const l of [
      ...r.hits.map((h) => h.label),
      ...r.soft.map((h) => h.label),
      ...r.gaps,
    ])
      assert.ok(marked.has(l), `${l} unmarked in "${text}"`);
  }
  const pg = fitMarks(c, "Postgres");
  assert.equal(pg.length, 1);
  assert.deepEqual([...pg[0].labels].sort(), ["PostgreSQL", "SQL"]);
});

test("a shared result round-trips without the posting's text", () => {
  const text =
    "Java, Python, React and Rust at an early-stage startup; Kubernetes and ASP.NET a plus.";
  const r = matchFit(c, text);
  const code = encodeFit(r);
  assert.ok(!code.includes("early-stage"));
  const back = decodeFit(c, code)!;
  assert.deepEqual(
    back.hits.map((h) => h.label),
    r.hits.map((h) => h.label),
  );
  assert.deepEqual(
    back.soft.map((h) => h.label),
    r.soft.map((h) => h.label),
  );
  assert.deepEqual([...back.gaps].sort(), [...r.gaps].sort());
  assert.equal(back.pct, r.pct);
  assert.equal(decodeFit(c, "nonsense|%E0%A4%A"), null);
  assert.equal(decodeFit(c, "not-a-term|Not A Tool"), null);
});

test("the posting's title picks the lens when the work backs it", () => {
  const ai =
    "Software Engineer, AI Products (Fintech)\nLLM agents and RAG over SEC filings for investment teams; Python.";
  assert.equal(fitRole(matchFit(c, ai), ai), "fintech");
  const q =
    "Quantitative Developer\nLow-latency trading systems in C++ and Rust; Monte Carlo; volatility.";
  assert.equal(fitRole(matchFit(c, q), q), "fintech");
  const fe = "Frontend Engineer\nReact, Next.js and TypeScript; REST APIs.";
  assert.equal(fitRole(matchFit(c, fe), fe), "fullstack");
  // Without a title, ties still go to the more specific lens.
  assert.equal(fitRole(matchFit(c, "LLMs, RAG, React, Next.js")), "ai");
});
