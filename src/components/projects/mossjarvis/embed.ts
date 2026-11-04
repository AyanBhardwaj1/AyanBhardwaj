/**
 * mossJARVIS's on-device embedding, ported line for line from the app's
 * `localEmbedding()` (jarvis-store.ts). No model: word features plus
 * character trigrams, FNV-1a hashed into 384 signed buckets, L2-normalised.
 * The app hands these vectors to Moss as custom embeddings.
 */

export const DIMS = 384;

export function hashFeature(value: string, seed = 2166136261) {
  let hash = seed >>> 0;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function features(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = normalized.split(" ").filter(Boolean);
  return [
    ...words.map((w) => `w:${w}`),
    ...words.flatMap((w) => {
      const padded = `^${w}$`;
      return Array.from(
        { length: Math.max(0, padded.length - 2) },
        (_, i) => `g:${padded.slice(i, i + 3)}`,
      );
    }),
  ];
}

export type Placed = { feature: string; bucket: number; sign: 1 | -1 };

export function place(feature: string): Placed {
  return {
    feature,
    bucket: hashFeature(feature) % DIMS,
    sign: hashFeature(feature, 2246822519) % 2 === 0 ? 1 : -1,
  };
}

export function localEmbedding(value: string) {
  const v = new Array<number>(DIMS).fill(0);
  for (const f of features(value)) {
    const p = place(f);
    v[p.bucket] += p.sign;
  }
  const mag = Math.sqrt(v.reduce((s, c) => s + c * c, 0)) || 1;
  return v.map((c) => c / mag);
}

export function cosine(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}
