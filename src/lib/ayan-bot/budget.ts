import type { Store } from "./store";

/**
 * Hard spend cap for ayan-bot.
 *
 * Before a model call, the request's WORST-CASE cost (estimated input tokens
 * plus the full output-token cap) is reserved against a daily and a monthly
 * budget. If either would go over, the call never happens. When the reply
 * finishes, the reservation is settled down to the real cost from the API's
 * usage report. Money is tracked in integer micro-dollars (1e-6 USD).
 *
 * Defaults: $0.50 a day and $5 a month, at gpt-6-luna list prices ($0.10 in /
 * $0.50 out per 1M tokens), which is roughly 400 to 500 answers a day. Any
 * other model is priced conservatively unless its prices are set explicitly.
 *
 * This caps what the site *asks* OpenAI to spend. Also set a monthly budget
 * on the OpenAI project itself as the final backstop.
 */

export const DEFAULT_MODEL = "gpt-6-luna";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export type Pricing = { inPerM: number; outPerM: number };

/** USD per 1M tokens. Unknown models get a deliberately high default. */
export function pricing(model: string, env = process.env): Pricing {
  const known = model === DEFAULT_MODEL;
  return {
    inPerM: num(env.AYAN_BOT_PRICE_IN_PER_M, known ? 0.1 : 2.5),
    outPerM: num(env.AYAN_BOT_PRICE_OUT_PER_M, known ? 0.5 : 10),
  };
}

export function budgets(env = process.env) {
  return {
    dailyUsd: num(env.AYAN_BOT_DAILY_BUDGET_USD, 0.5),
    monthlyUsd: num(env.AYAN_BOT_MONTHLY_BUDGET_USD, 5),
  };
}

/** Conservative token estimate: ~3 characters per token for English + markup. */
export const estimateTokens = (chars: number) => Math.ceil(chars / 3) + 16;

/** Cost in micro-dollars, rounded up so estimates never undershoot. */
export function costMicros(inTok: number, outTok: number, p: Pricing) {
  return Math.ceil(inTok * p.inPerM + outTok * p.outPerM);
}

const toMicros = (usd: number) => Math.round(usd * 1_000_000);

/** UTC day and month keys; counters expire on their own a little after. */
export function periodKeys(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  return {
    day: `ab:spend:d:${day}`,
    month: `ab:spend:m:${month}`,
  };
}
const DAY_TTL = 2 * 24 * 3600;
const MONTH_TTL = 32 * 24 * 3600;

export type Reservation = {
  micros: number;
  keys: { day: string; month: string };
};

export type ReserveResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; reason: "daily" | "monthly" | "store" };

/**
 * Atomically reserve `micros` against both budgets. INCRBY returns the new
 * total, so concurrent requests can't both slip under the cap: whoever
 * crosses it backs their reservation out and is refused.
 */
export async function reserve(
  store: Store,
  micros: number,
  env = process.env,
  now = new Date(),
): Promise<ReserveResult> {
  const { dailyUsd, monthlyUsd } = budgets(env);
  const keys = periodKeys(now);
  try {
    const day = await store.incr(keys.day, micros, DAY_TTL);
    if (day > toMicros(dailyUsd)) {
      await store.incr(keys.day, -micros, DAY_TTL);
      return { ok: false, reason: "daily" };
    }
    const month = await store.incr(keys.month, micros, MONTH_TTL);
    if (month > toMicros(monthlyUsd)) {
      await store.incr(keys.month, -micros, MONTH_TTL);
      await store.incr(keys.day, -micros, DAY_TTL);
      return { ok: false, reason: "monthly" };
    }
    return { ok: true, reservation: { micros, keys } };
  } catch {
    // A configured store that can't be reached fails CLOSED: no budget
    // check, no model call.
    return { ok: false, reason: "store" };
  }
}

/** Replace a reservation with the real cost (refund the difference). */
export async function settle(
  store: Store,
  r: Reservation,
  actualMicros: number,
) {
  const refund = r.micros - Math.min(r.micros, Math.max(0, actualMicros));
  if (refund <= 0) return;
  try {
    await store.incr(r.keys.day, -refund, DAY_TTL);
    await store.incr(r.keys.month, -refund, MONTH_TTL);
  } catch {
    // Keeping the full reservation only over-counts spend, which is safe.
  }
}

/** Spend so far, for the status endpoint (micro-dollars). */
export async function spent(store: Store, now = new Date()) {
  const keys = periodKeys(now);
  const [day, month] = await Promise.all([
    store.getNum(keys.day),
    store.getNum(keys.month),
  ]);
  return { day, month };
}
