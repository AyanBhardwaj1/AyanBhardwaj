/**
 * The small numeric core behind the earned-autonomy demo, written the way the
 * YouBank README describes its engine: Lanczos log-gamma, the regularized
 * incomplete beta by continued fraction, a quantile by bisection, and a
 * seeded mulberry32 generator. No dependencies.
 */

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function logGamma(z: number): number {
  if (z < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i + 1);
  const t = z + LANCZOS.length - 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
  );
}

const logBeta = (a: number, b: number) =>
  logGamma(a) + logGamma(b) - logGamma(a + b);

/** Continued fraction for the incomplete beta (modified Lentz). */
function betacf(x: number, a: number, b: number): number {
  const EPS = 1e-12;
  const TINY = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b), i.e. the Beta(a, b) CDF at x. */
export function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta(a, b));
  return x < (a + 1) / (a + b + 2)
    ? (front * betacf(x, a, b)) / a
    : 1 - (front * betacf(1 - x, b, a)) / b;
}

/** Inverse CDF by bisection: plenty fast for a demo, and monotone by construction. */
export function betaQuantile(p: number, a: number, b: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (betaCdf(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function betaPdf(x: number, a: number, b: number): number {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp(
    (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b),
  );
}

/** Seeded PRNG so "Simulate a person" plays the same way every time. */
export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The rule from the README: offered after 20+ decisions, when 90% sure that at most 10% would need edits. */
export const AUTOPILOT = {
  minDecisions: 20,
  confidence: 0.9,
  maxEditRate: 0.1,
};

export function engineState(good: number, bad: number) {
  // Uniform Beta(1, 1) prior on the share of drafts that go out unchanged.
  const a = good + 1;
  const b = bad + 1;
  const n = good + bad;
  const mean = a / (a + b);
  const lo = betaQuantile(0.05, a, b);
  const hi = betaQuantile(0.95, a, b);
  // 90% sure the good rate is at least this, so edits are at most 1 - this.
  const floor = betaQuantile(1 - AUTOPILOT.confidence, a, b);
  const editBound = 1 - floor;
  const earned =
    n >= AUTOPILOT.minDecisions && editBound <= AUTOPILOT.maxEditRate;
  return { a, b, n, mean, lo, hi, floor, editBound, earned };
}
