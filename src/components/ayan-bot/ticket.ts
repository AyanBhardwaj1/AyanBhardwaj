import { solve } from "@/lib/ayan-bot/solve";

/**
 * Client side of ayan-bot's proof-of-work handshake. The next ticket is
 * fetched and solved in the background (when the panel opens, and right
 * after each message), so sending usually waits on nothing.
 */

export type Ticket = {
  ticket: string;
  nonce: string;
  exp: number;
  mode: string | null;
  remaining: number | null;
};

async function fetchAndSolve(signal?: AbortSignal): Promise<Ticket | null> {
  const res = await fetch("/api/ayan-bot/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal,
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    ticket?: string;
    bits?: number;
    exp?: number;
    mode?: string;
    remaining?: number | null;
  };
  const base = {
    exp: j.exp ?? 0,
    mode: typeof j.mode === "string" ? j.mode : null,
    remaining: typeof j.remaining === "number" ? j.remaining : null,
  };
  // An empty ticket means proof-of-work is switched off on the server.
  if (!j.ticket || !j.bits) return { ticket: "", nonce: "", ...base };
  const nonce = await solve(j.ticket, j.bits, signal);
  return { ticket: j.ticket, nonce, ...base };
}

let next: Promise<Ticket | null> | null = null;

/** Start fetching and solving the next ticket (no-op if one is on the way). */
export function prefetchTicket(): Promise<Ticket | null> {
  if (!next) next = fetchAndSolve().catch(() => null);
  return next;
}

const fresh = (t: Ticket | null) =>
  t !== null && (t.exp === 0 || t.exp * 1000 - Date.now() > 20_000);

/** A ready ticket for one message; warms the next one behind it. */
export async function takeTicket(signal?: AbortSignal): Promise<Ticket | null> {
  let t = next ? await next : null;
  next = null;
  if (!fresh(t)) t = await fetchAndSolve(signal).catch(() => null);
  void prefetchTicket();
  return t;
}

/** Throw away the cached ticket (after the server rejected one). */
export function dropTicket() {
  next = null;
}

/** Which page the visitor is chatting from, for page-aware answers. */
export function currentPage(): string {
  const p = window.location.pathname;
  const m = /^\/projects\/([a-z0-9-]+)\/?$/.exec(p);
  if (m) return m[1];
  if (p.startsWith("/functions")) return "functions";
  return "home";
}
