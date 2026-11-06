import { budgets, spent } from "./budget";
import type { Store } from "./store";

/**
 * Server-only defenses that need shared state: per-visitor rate windows that
 * hold across instances, a circuit breaker for upstream trouble, and a
 * proof-of-work difficulty that rises as the day's budget is used.
 */

export const SHARED_RATE = [
  { name: "10m", windowSec: 10 * 60, max: 10 },
  { name: "1d", windowSec: 24 * 3600, max: 40 },
] as const;

/** Tickets a visitor may request per 10 minutes (each costs us nothing much). */
export const CHALLENGE_RATE = { windowSec: 10 * 60, max: 40 };

const bucket = (windowSec: number, now: number) =>
  Math.floor(now / 1000 / windowSec);

function rateKeys(client: string, now: number) {
  return SHARED_RATE.map((r) => ({
    ...r,
    key: `ab:rl:${r.name}:${client}:${bucket(r.windowSec, now)}`,
    retryAfterSec: r.windowSec - (Math.floor(now / 1000) % r.windowSec),
  }));
}

export type RateResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

/** Counts one message for `client` and says whether it is allowed. */
export async function takeMessage(
  store: Store,
  client: string,
  now = Date.now(),
): Promise<RateResult> {
  let remaining = Infinity;
  for (const r of rateKeys(client, now)) {
    const n = await store.incr(r.key, 1, r.windowSec + 60);
    if (n > r.max)
      return { ok: false, remaining: 0, retryAfterSec: r.retryAfterSec };
    remaining = Math.min(remaining, r.max - n);
  }
  return { ok: true, remaining, retryAfterSec: 0 };
}

/** Messages left for `client` without counting one (for the usage meter). */
export async function peekRemaining(
  store: Store,
  client: string,
  now = Date.now(),
): Promise<number> {
  let remaining = Infinity;
  for (const r of rateKeys(client, now))
    remaining = Math.min(remaining, r.max - (await store.getNum(r.key)));
  return Math.max(0, remaining);
}

/** Counts one ticket request for `client`. */
export async function takeChallenge(
  store: Store,
  client: string,
  now = Date.now(),
): Promise<boolean> {
  const key = `ab:ch:${client}:${bucket(CHALLENGE_RATE.windowSec, now)}`;
  const n = await store.incr(key, 1, CHALLENGE_RATE.windowSec + 60);
  return n <= CHALLENGE_RATE.max;
}

// ---------- Circuit breaker ----------

const BREAKER_OPEN = "ab:breaker:open";
const BREAKER_ERRS = "ab:breaker:errs";

/** Open after 5 upstream failures within a minute; stays open 5 minutes. */
export async function recordUpstreamFailure(store: Store) {
  try {
    const n = await store.incr(BREAKER_ERRS, 1, 60);
    if (n >= 5) await store.setOnce(BREAKER_OPEN, 300);
  } catch {
    // Breaker is best effort.
  }
}

export async function breakerOpen(store: Store) {
  try {
    return await store.has(BREAKER_OPEN);
  } catch {
    return false;
  }
}

// ---------- Proof-of-work difficulty ----------

export const BASE_BITS = 15;

/** 15 bits normally; harder as the day's budget runs down. */
export async function difficulty(store: Store, env = process.env) {
  const base = Math.min(
    20,
    Math.max(8, Number(env.AYAN_BOT_POW_BITS) || BASE_BITS),
  );
  try {
    const { day } = await spent(store);
    const cap = budgets(env).dailyUsd * 1_000_000;
    if (cap > 0 && day > cap * 0.8) return base + 3;
    if (cap > 0 && day > cap * 0.5) return base + 2;
  } catch {
    // Unknown spend: keep the base difficulty.
  }
  return base;
}

export const powDisabled = (env = process.env) => env.AYAN_BOT_POW === "0";
