import { PAGES, type Page } from "./corpus";

/**
 * Demo retrieval. Mycelium itself uses Moss's moss-minilm model in WASM;
 * this page uses a tiny hashed embedding so it can run with no download.
 * The two-path shape (lexical cache first, vector results replace it) is
 * the real one.
 */

const DIMS = 256;

function hash(s: string, seed = 2166136261) {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const STOP = new Set([
  "the",
  "and",
  "that",
  "with",
  "for",
  "why",
  "how",
  "what",
  "from",
  "your",
  "you",
  "not",
  "are",
  "its",
  "into",
]);

export const tokenize = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

function embed(text: string) {
  const v = new Float32Array(DIMS);
  for (const w of tokenize(text)) {
    const p = `^${w}$`;
    v[hash(`w:${w}`) % DIMS] += 2;
    for (let i = 0; i + 3 <= p.length; i++)
      v[hash(`g:${p.slice(i, i + 3)}`) % DIMS] += 1;
  }
  let m = 0;
  for (const x of v) m += x * x;
  m = Math.sqrt(m) || 1;
  for (let i = 0; i < DIMS; i++) v[i] /= m;
  return v;
}

const docText = (p: Page) =>
  `${p.title} ${p.tags.join(" ")} ${p.tags.join(" ")} ${p.excerpt}`;

let index: Float32Array[] | null = null;
/** "loadIndex": embed the demo library once. */
export function hydrate() {
  if (!index) index = PAGES.map((p) => embed(docText(p)));
  return index;
}
export const isHydrated = () => index !== null;
export function dropIndex() {
  index = null;
}

export type Hit = { page: Page; score: number };

export function vectorSearch(q: string, k = 8): Hit[] {
  const idx = hydrate();
  const qv = embed(q);
  return PAGES.map((page, i) => {
    let s = 0;
    const d = idx[i];
    for (let j = 0; j < DIMS; j++) s += qv[j] * d[j];
    return { page, score: s };
  })
    .filter((h) => h.score > 0.14)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function lexicalSearch(q: string, k = 8): Hit[] {
  const qt = tokenize(q);
  if (!qt.length) return [];
  return PAGES.map((page) => {
    const bag = new Set(tokenize(docText(page)));
    const n = qt.filter((t) => bag.has(t)).length;
    return { page, score: n / qt.length };
  })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
