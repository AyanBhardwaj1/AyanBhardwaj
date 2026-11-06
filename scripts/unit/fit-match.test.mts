// Unit tests for the browser half of the Fit check. Run: npm run test:unit
// (Node's built-in runner with type stripping; no build needed.)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compileFit,
  fitRole,
  fitSummary,
  looksLikeJobDescription,
  matchFit,
} from "../../src/lib/fit-match.ts";

const ev = (name: string) => [{ name, href: `/projects/${name}` }];
const index = {
  terms: [
    { id: "python", label: "Python", jd: "\\bpython\\b", evidence: ev("a") },
    {
      id: "javascript",
      label: "JavaScript",
      jd: "\\bjavascript\\b|(?<![.\\w])js\\b|\\becmascript\\b",
      evidence: ev("b"),
    },
    { id: "nextjs", label: "Next.js", jd: "next\\.?js", evidence: ev("c") },
    { id: "java", label: "Java", jd: "\\bjava\\b(?!script)", evidence: [] },
    { id: "llm", label: "LLMs", jd: "\\bllms?\\b", evidence: ev("d") },
    { id: "rag", label: "RAG", jd: "\\brag\\b", evidence: ev("e") },
    { id: "react", label: "React", jd: "\\breact\\b", evidence: ev("f") },
  ],
  notOnSite: ["Go", "Golang", ".NET", "C#", "Kubernetes", "Vue"],
};
const c = compileFit(index);
const labels = (t: string) => {
  const r = matchFit(c, t);
  return { hits: r.hits.map((h) => h.label), gaps: r.gaps };
};

test("Next.js does not imply JavaScript", () => {
  assert.deepEqual(labels("Next.js and Node.js").hits, ["Next.js"]);
  assert.ok(labels("plain JS").hits.includes("JavaScript"));
});

test("a term with no evidence is a gap, not silently dropped", () => {
  const r = labels("Java developer with Python");
  assert.deepEqual(r.hits, ["Python"]);
  assert.ok(r.gaps.includes("Java"));
});

test("short names match exactly and case-sensitively", () => {
  assert.deepEqual(labels("let's go build it").gaps, []);
  assert.deepEqual(labels("Go services").gaps, ["Go"]);
  assert.deepEqual(labels("Golang services").gaps, ["Golang"]);
  assert.deepEqual(labels("Vue.js frontends").gaps, ["Vue"]);
});

test("symbol-led names match inside compounds (ASP.NET)", () => {
  assert.deepEqual(labels("ASP.NET Core and C#").gaps, [".NET", "C#"]);
});

test("percent and totals", () => {
  const r = matchFit(c, "Python, LLMs and Kubernetes");
  assert.equal(r.total, 3);
  assert.equal(r.pct, 67);
});

test("fitRole needs two signals and prefers the specific lens on ties", () => {
  assert.equal(fitRole(matchFit(c, "Python only")), null);
  assert.equal(fitRole(matchFit(c, "LLMs and RAG")), "ai");
  // ai 2 vs fullstack 2 (React, Next.js): ai wins the tie.
  assert.equal(fitRole(matchFit(c, "LLMs, RAG, React, Next.js")), "ai");
});

test("summary lists hits with evidence and the gaps", () => {
  const s = fitSummary(
    matchFit(c, "Python and Kubernetes"),
    "https://x/cv#fit",
  );
  assert.match(s, /1 of 2 recognised requirements/);
  assert.match(s, /\+ Python: a/);
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
  const nasty = "a".repeat(4000) + ".".repeat(4000);
  const t0 = performance.now();
  matchFit(c, nasty);
  assert.ok(performance.now() - t0 < 200);
});
