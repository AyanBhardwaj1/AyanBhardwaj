import { SITE_URL } from "@/lib/site";
import {
  BUDGET_MESSAGE,
  GLOBAL_RULE,
  INJECTION_REFUSAL,
  LEAK_REFUSAL,
  LIMITS,
  OFFLINE_MESSAGE,
  RATE_LIMIT_MESSAGE,
  RATE_RULES,
  SlidingWindowLimiter,
  clientIp,
  isAllowedOrigin,
  isCrossSiteFetch,
  leaks,
  looksLikeInjection,
  parseChatBody,
  type ChatMessage,
} from "@/lib/ayan-bot/guard";
import {
  DEFAULT_MODEL,
  costMicros,
  estimateTokens,
  pricing,
  reserve,
  settle,
  type Reservation,
} from "@/lib/ayan-bot/budget";
import {
  baseBits,
  breakerOpen,
  powDisabled,
  recordUpstreamFailure,
  takeMessage,
} from "@/lib/ayan-bot/defense";
import { botMode, type BotMode } from "@/lib/ayan-bot/mode";
import { brief, mockChunks, mockReply } from "@/lib/ayan-bot/mock";
import { TICKET_TTL_SEC, clientKey, verifyTicket } from "@/lib/ayan-bot/pow";
import { CANARY, SYSTEM_PROMPT, pageContext } from "@/lib/ayan-bot/prompt";
import { getStore, storeConfigured } from "@/lib/ayan-bot/store";

/**
 * POST /api/ayan-bot: the ayan-bot chat endpoint.
 *
 * A POST Route Handler is never cached or prerendered, so it runs per request
 * while every page stays static (route handlers sit outside the layout tree,
 * so the root layout's `ensureStatic` doesn't apply here).
 *
 * Model: OpenAI Responses API via fetch (no SDK). Default `gpt-6-luna`,
 * which OpenAI's model docs (checked Nov 2026) list as their most efficient
 * model for focused, high-volume tasks ($0.10 / $0.50 per 1M in/out tokens).
 * Reasoning effort "none" keeps latency low and stops hidden reasoning tokens
 * from eating the 400-token output budget. Override with OPENAI_MODEL.
 *
 * Secrets: reads OPENAI_API_KEY from the environment only. It never reaches
 * the client and is never logged.
 *
 * Defense in depth, in order: kill switch, fetch-metadata + origin checks,
 * size/shape validation, a single-use proof-of-work ticket bound to the
 * visitor, per-instance and shared rate limits, an injection filter that
 * never reaches the model, a circuit breaker, a hard dollar budget (worst
 * case reserved before the call, settled to real usage after), and an output
 * guard that cuts the stream if the reply starts leaking instructions or
 * anything key-shaped. See docs/AYAN-BOT.md.
 */

// Node.js runtime is the default (an explicit `runtime` export is rejected with cacheComponents).
export const maxDuration = 30;

const OPENAI_URL = upstreamUrl();

/**
 * Tests can point the route at a local fake (AYAN_BOT_UPSTREAM_URL). Only
 * loopback addresses are accepted, so a mistyped value can never send the
 * API key to another host.
 */
function upstreamUrl() {
  const fallback = "https://api.openai.com/v1/responses";
  const o = process.env.AYAN_BOT_UPSTREAM_URL;
  if (!o) return fallback;
  try {
    const u = new URL(o);
    return u.protocol === "http:" &&
      (u.hostname === "127.0.0.1" || u.hostname === "localhost")
      ? u.toString()
      : fallback;
  } catch {
    return fallback;
  }
}

const limiter = new SlidingWindowLimiter(RATE_RULES);
const globalLimiter = new SlidingWindowLimiter([GLOBAL_RULE], 1);

type Mode = BotMode;

const baseHeaders = (m: Mode) => ({
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Ayan-Bot-Mode": m,
});

function json(
  status: number,
  body: { error: string; message: string },
  m: Mode,
  extra: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: { ...baseHeaders(m), ...extra },
  });
}

/** A plain-text stream of `chunks`, with a small delay so it renders like typing. */
function textStream(chunks: string[], signal: AbortSignal, delayMs = 0) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const c of chunks) {
        if (signal.aborted) break;
        controller.enqueue(enc.encode(c));
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.close();
    },
  });
}

const streamHeaders = (m: Mode) => ({
  ...baseHeaders(m),
  "Content-Type": "text/plain; charset=utf-8",
});

async function callOpenAI(
  history: ChatMessage[],
  signal: AbortSignal,
  lean: boolean,
  instructions: string,
) {
  const body: Record<string, unknown> = {
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    instructions,
    input: history.map((m) => ({ role: m.role, content: m.content })),
    max_output_tokens: LIMITS.outputTokens,
    stream: true,
    store: false,
  };
  if (!lean) {
    body.reasoning = { effort: "none" };
    body.temperature = 0.6;
  }
  return fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
}

/** Characters held back before release, so a leak is caught before it's sent. */
const HOLDBACK = 48;

type Usage = { input: number; output: number };

/**
 * Converts the Responses API SSE stream into a plain text stream of output
 * deltas. Runs the output guard over everything generated so far and keeps
 * the last few characters back until they've been checked. Reports token
 * usage (or null if the stream ended without it) before closing.
 */
function relay(
  upstream: ReadableStream<Uint8Array>,
  onDone: (usage: Usage | null) => Promise<void>,
) {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  let full = "";
  let sent = 0;
  let usage: Usage | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = upstream.getReader();
      const release = (all: boolean) => {
        const upTo = all ? full.length : Math.max(sent, full.length - HOLDBACK);
        if (upTo > sent) controller.enqueue(enc.encode(full.slice(sent, upTo)));
        sent = upTo;
      };
      let stopped = false;
      try {
        outer: for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n\n")) !== -1) {
            const block = buf.slice(0, i);
            buf = buf.slice(i + 2);
            for (const line of block.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              let evt: {
                type?: string;
                delta?: unknown;
                response?: {
                  usage?: { input_tokens?: number; output_tokens?: number };
                };
              };
              try {
                evt = JSON.parse(data);
              } catch {
                continue;
              }
              const u = evt.response?.usage;
              if (u && typeof u.input_tokens === "number")
                usage = { input: u.input_tokens, output: u.output_tokens ?? 0 };
              if (
                evt.type === "response.output_text.delta" &&
                typeof evt.delta === "string"
              ) {
                full += evt.delta;
                if (leaks(full, CANARY)) {
                  stopped = true;
                  controller.enqueue(enc.encode(LEAK_REFUSAL));
                  console.warn("[ayan-bot] output guard stopped a reply");
                  void reader.cancel();
                  break outer;
                }
                release(false);
              } else if (evt.type === "response.incomplete") {
                full += " …";
              } else if (
                evt.type === "error" ||
                evt.type === "response.failed"
              ) {
                full +=
                  "\n\n(ayan-bot lost the feed mid-sentence. Try again in a moment.)";
              }
            }
          }
        }
        if (!stopped) release(true);
      } catch {
        // Client disconnected or upstream dropped; just end the stream.
      } finally {
        await onDone(usage).catch(() => {});
        controller.close();
      }
    },
    cancel() {
      void reader?.cancel();
    },
  });
}

/** Messages allowed for a page context key. */
function pageOf(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const p = (body as { page?: unknown }).page;
  return typeof p === "string" && p.length <= 32 ? p : null;
}

const ticketOf = (body: unknown) => {
  const b = (typeof body === "object" && body !== null ? body : {}) as {
    ticket?: unknown;
    nonce?: unknown;
  };
  return { ticket: b.ticket, nonce: b.nonce };
};

/** Store calls that fail: CLOSED when a shared store is configured, open locally. */
async function guarded<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T | "fail"> {
  try {
    return await fn();
  } catch {
    return storeConfigured() ? "fail" : fallback;
  }
}

function briefOr(
  question: string,
  m: Mode,
  signal: AbortSignal,
  fallback: string,
  extra: Record<string, string> = {},
) {
  // The common questions still get a canned, factual brief (no model call);
  // anything else gets `fallback`. 200 (not 503) so visitors' consoles stay
  // quiet; the widget reads X-Ayan-Bot-Mode to show the offline state.
  const saved = brief(question);
  if (saved)
    return new Response(textStream(mockChunks(saved), signal, 22), {
      headers: { ...streamHeaders(m), ...extra },
    });
  return json(200, { error: "offline", message: fallback }, m, extra);
}

export async function POST(request: Request) {
  let m = botMode();
  const h = request.headers;

  if (
    isCrossSiteFetch(h) ||
    !isAllowedOrigin(h, SITE_URL, process.env.NODE_ENV !== "production")
  )
    return json(403, { error: "forbidden", message: "Forbidden." }, m);

  if (!(h.get("content-type") ?? "").toLowerCase().includes("application/json"))
    return json(
      415,
      { error: "unsupported_media_type", message: "Send JSON." },
      m,
    );

  const declared = Number(h.get("content-length") ?? "0");
  if (declared > LIMITS.bodyBytes)
    return json(413, { error: "too_large", message: "Request too large." }, m);

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json(400, { error: "bad_request", message: "Bad request." }, m);
  }
  if (new TextEncoder().encode(raw).length > LIMITS.bodyBytes)
    return json(413, { error: "too_large", message: "Request too large." }, m);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad_request", message: "Bad request." }, m);
  }

  const parsed = parseChatBody(body);
  if (!parsed.ok)
    return json(
      parsed.status,
      {
        error: parsed.error,
        message:
          parsed.error === "message_too_long"
            ? `Keep it under ${LIMITS.userChars} characters and I'm all yours.`
            : "Bad request.",
      },
      m,
    );
  const history = parsed.value;
  const question = history.at(-1)!.content;

  const store = getStore();
  const client = clientKey(clientIp(h), h.get("user-agent") ?? "");

  // 1. Proof of work: a fresh, signed, single-use ticket for this visitor.
  if (!powDisabled()) {
    const { ticket, nonce } = ticketOf(body);
    const t = verifyTicket(ticket, nonce, client, baseBits());
    if (!t.ok)
      return json(
        401,
        { error: "ticket", message: "Session expired. Send that again." },
        m,
      );
    const fresh = await guarded(
      () => store.setOnce(`ab:t:${t.id}`, TICKET_TTL_SEC + 60),
      true,
    );
    if (fresh === "fail")
      return json(503, { error: "unavailable", message: OFFLINE_MESSAGE }, m);
    if (!fresh)
      return json(
        401,
        { error: "ticket", message: "Session expired. Send that again." },
        m,
      );
  }

  // 2. Rate limits. Mock mode costs nothing, so local testing isn't throttled.
  let remaining: number | null = null;
  if (m !== "mock") {
    const rl = limiter.check(clientIp(h));
    if (!rl.ok)
      return json(
        429,
        { error: "rate_limited", message: RATE_LIMIT_MESSAGE },
        m,
        {
          "Retry-After": String(rl.retryAfterSec),
          "X-Ayan-Bot-Remaining": "0",
        },
      );
    const shared = await guarded(() => takeMessage(store, client), {
      ok: true,
      remaining: NaN,
      retryAfterSec: 0,
    });
    if (shared === "fail")
      return json(503, { error: "unavailable", message: OFFLINE_MESSAGE }, m);
    if (!shared.ok)
      return json(
        429,
        { error: "rate_limited", message: RATE_LIMIT_MESSAGE },
        m,
        {
          "Retry-After": String(shared.retryAfterSec),
          "X-Ayan-Bot-Remaining": "0",
        },
      );
    if (Number.isFinite(shared.remaining)) remaining = shared.remaining;
  }
  const meter: Record<string, string> =
    remaining === null ? {} : { "X-Ayan-Bot-Remaining": String(remaining) };

  // 3. Obvious injection attempts get a fixed answer and never reach the model.
  if (looksLikeInjection(question))
    return new Response(
      textStream(mockChunks(INJECTION_REFUSAL), request.signal, 18),
      { headers: { ...streamHeaders(m), ...meter } },
    );

  // 4. Upstream trouble trips the breaker: briefs only for a few minutes.
  if (m === "live" && (await breakerOpen(store))) m = "offline";

  if (m === "offline")
    return briefOr(question, m, request.signal, OFFLINE_MESSAGE, meter);

  if (m === "mock")
    return new Response(
      textStream(mockChunks(mockReply(question)), request.signal, 28),
      { headers: { ...streamHeaders(m), ...meter } },
    );

  const g = globalLimiter.check("all");
  if (!g.ok)
    return json(
      429,
      { error: "rate_limited", message: RATE_LIMIT_MESSAGE },
      m,
      { "Retry-After": String(g.retryAfterSec) },
    );

  // 5. Hard budget: reserve the worst case before spending anything.
  const instructions = SYSTEM_PROMPT + pageContext(pageOf(body));
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const price = pricing(model);
  const inChars =
    instructions.length + history.reduce((n, x) => n + x.content.length, 0);
  const worst = costMicros(estimateTokens(inChars), LIMITS.outputTokens, price);
  const held = await reserve(store, worst);
  if (!held.ok) {
    if (held.reason !== "store")
      console.warn(`[ayan-bot] ${held.reason} budget reached; serving briefs`);
    return briefOr(question, "offline", request.signal, BUDGET_MESSAGE, {
      ...meter,
      "X-Ayan-Bot-Budget":
        held.reason === "store" ? "unavailable" : "exhausted",
    });
  }
  const reservation: Reservation = held.reservation;
  const release = (u: Usage | null) =>
    u
      ? settle(store, reservation, costMicros(u.input, u.output, price))
      : Promise.resolve(); // no usage report: keep the full reservation

  let upstream: Response;
  try {
    upstream = await callOpenAI(history, request.signal, false, instructions);
    // If a custom OPENAI_MODEL rejects reasoning/temperature, retry once without them.
    if (upstream.status === 400) {
      void upstream.body?.cancel();
      upstream = await callOpenAI(history, request.signal, true, instructions);
    }
  } catch {
    await settle(store, reservation, 0);
    if (request.signal.aborted) return new Response(null, { status: 499 });
    await recordUpstreamFailure(store);
    return json(502, { error: "upstream", message: OFFLINE_MESSAGE }, m);
  }

  if (!upstream.ok || !upstream.body) {
    // Log status only: never the key, never the prompt.
    console.error(`[ayan-bot] OpenAI responded ${upstream.status}`);
    void upstream.body?.cancel();
    await settle(store, reservation, 0);
    if (upstream.status === 429 || upstream.status >= 500)
      await recordUpstreamFailure(store);
    const status = upstream.status === 429 ? 503 : 502;
    return json(status, { error: "upstream", message: OFFLINE_MESSAGE }, m);
  }

  return new Response(relay(upstream.body, release), {
    headers: { ...streamHeaders(m), ...meter },
  });
}
