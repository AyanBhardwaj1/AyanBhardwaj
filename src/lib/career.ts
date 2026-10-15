import { careerEvents, type CareerEvent } from "@/content/extras";

/**
 * The "AYAN index": 100 + cumulative event impact, with small seeded noise so
 * it reads like a price series. Illustrative only, and labelled as such.
 * Computed at build time; the seeded PRNG keeps it deterministic.
 */

export type CareerPoint = { month: string; value: number; event?: CareerEvent };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const addMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export function careerSeries(): {
  points: CareerPoint[];
  min: number;
  max: number;
} {
  const events = [...careerEvents].sort((a, b) => a.date.localeCompare(b.date));
  const rand = mulberry32(2024);
  const start = "2024-06";
  const end = events.at(-1)!.date;
  const points: CareerPoint[] = [];
  let base = 100;
  for (let m = start; m <= end; m = addMonth(m)) {
    const event = events.find((e) => e.date === m);
    if (event) base += event.impact;
    else base += 0.6; // steady drift: still shipping between headlines
    const noise = event ? 0 : (rand() - 0.45) * 3.2;
    points.push({
      month: m,
      value: Math.round((base + noise) * 10) / 10,
      event,
    });
  }
  const values = points.map((p) => p.value);
  return { points, min: Math.min(...values), max: Math.max(...values) };
}

export const formatMonth = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
