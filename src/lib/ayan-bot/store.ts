/**
 * Server-only counters for ayan-bot: budget, rate limits, one-time tokens,
 * circuit breaker.
 *
 * With Upstash Redis configured (Vercel Marketplace > Upstash, which sets
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, or the older KV_REST_API_*
 * names), every serverless instance shares the same counters, so the spend cap
 * and rate limits hold across the whole deployment. Without it, counters live
 * in this instance's memory: fine locally, best-effort in production.
 *
 * Talks to Upstash over its REST API with fetch (no SDK). Every call has a
 * short timeout; callers decide whether a failure fails open or closed.
 */

type Cmd = (string | number)[];

export interface Store {
  /** "redis" when counters are shared across instances. */
  readonly kind: "redis" | "memory";
  /** INCRBY key by, setting a TTL on first write. Returns the new value. */
  incr(key: string, by: number, ttlSec: number): Promise<number>;
  /** GET key as a number (0 when missing). */
  getNum(key: string): Promise<number>;
  /** SET key value NX EX ttl. True when the key was newly set. */
  setOnce(key: string, ttlSec: number): Promise<boolean>;
  /** EXISTS key. */
  has(key: string): Promise<boolean>;
  /** Several INCRBYs (each with a first-write TTL) in one round trip. */
  incrMany(
    items: { key: string; by: number; ttlSec: number }[],
  ): Promise<number[]>;
  /** Several GETs as numbers (0 when missing) in one round trip. */
  getMany(keys: string[]): Promise<number[]>;
}

const TIMEOUT_MS = 1500;

function redisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export const storeConfigured = () => redisConfig() !== null;

class RedisStore implements Store {
  readonly kind = "redis" as const;
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async pipeline(cmds: Cmd[]): Promise<unknown[]> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmds),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`store ${res.status}`);
    const out = (await res.json()) as { result?: unknown; error?: string }[];
    return out.map((r) => {
      if (r.error) throw new Error("store command failed");
      return r.result;
    });
  }

  async incr(key: string, by: number, ttlSec: number) {
    const [v] = await this.pipeline([
      ["INCRBY", key, Math.trunc(by)],
      ["EXPIRE", key, ttlSec, "NX"],
    ]);
    return Number(v);
  }
  async getNum(key: string) {
    const [v] = await this.pipeline([["GET", key]]);
    return v == null ? 0 : Number(v);
  }
  async setOnce(key: string, ttlSec: number) {
    const [v] = await this.pipeline([["SET", key, "1", "NX", "EX", ttlSec]]);
    return v === "OK";
  }
  async has(key: string) {
    const [v] = await this.pipeline([["EXISTS", key]]);
    return Number(v) > 0;
  }
  async incrMany(items: { key: string; by: number; ttlSec: number }[]) {
    if (!items.length) return [];
    const out = await this.pipeline(
      items.flatMap((i): Cmd[] => [
        ["INCRBY", i.key, Math.trunc(i.by)],
        ["EXPIRE", i.key, i.ttlSec, "NX"],
      ]),
    );
    return items.map((_, k) => Number(out[k * 2]));
  }
  async getMany(keys: string[]) {
    if (!keys.length) return [];
    const out = await this.pipeline(keys.map((k): Cmd => ["GET", k]));
    return out.map((v) => (v == null ? 0 : Number(v)));
  }
}

class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private data = new Map<string, { v: number; exp: number }>();
  private maxKeys = 20_000;

  private live(key: string, now = Date.now()) {
    const e = this.data.get(key);
    if (e && e.exp <= now) {
      this.data.delete(key);
      return undefined;
    }
    return e;
  }
  private trim() {
    while (this.data.size > this.maxKeys) {
      const first = this.data.keys().next().value;
      if (first === undefined) break;
      this.data.delete(first);
    }
  }
  async incr(key: string, by: number, ttlSec: number) {
    const now = Date.now();
    const e = this.live(key, now);
    const v = (e?.v ?? 0) + Math.trunc(by);
    this.data.set(key, { v, exp: e?.exp ?? now + ttlSec * 1000 });
    this.trim();
    return v;
  }
  async getNum(key: string) {
    return this.live(key)?.v ?? 0;
  }
  async setOnce(key: string, ttlSec: number) {
    if (this.live(key)) return false;
    this.data.set(key, { v: 1, exp: Date.now() + ttlSec * 1000 });
    this.trim();
    return true;
  }
  async has(key: string) {
    return this.live(key) !== undefined;
  }
  async incrMany(items: { key: string; by: number; ttlSec: number }[]) {
    const out: number[] = [];
    for (const i of items) out.push(await this.incr(i.key, i.by, i.ttlSec));
    return out;
  }
  async getMany(keys: string[]) {
    return Promise.all(keys.map((k) => this.getNum(k)));
  }
}

let cached: Store | null = null;

/** The shared store when configured, else this instance's memory. */
export function getStore(): Store {
  if (cached) return cached;
  const cfg = redisConfig();
  cached = cfg ? new RedisStore(cfg.url, cfg.token) : new MemoryStore();
  return cached;
}

/** For tests: swap in a fresh store. */
export function _setStore(s: Store | null) {
  cached = s;
}

export { MemoryStore };
