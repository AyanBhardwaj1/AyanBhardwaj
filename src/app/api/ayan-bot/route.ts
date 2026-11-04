import { SITE_URL } from "@/lib/site";
import {
  GLOBAL_RULE,
  INJECTION_REFUSAL,
  LIMITS,
  OFFLINE_MESSAGE,
  RATE_LIMIT_MESSAGE,
  RATE_RULES,
  SlidingWindowLimiter,
  clientIp,
  isAllowedOrigin,
  looksLikeInjection,
  parseChatBody,
  type ChatMessage,
} from "@/lib/ayan-bot/guard";
import { mockChunks, mockReply } from "@/lib/ayan-bot/mock";
import { SYSTEM_PROMPT } from "@/lib/ayan-bot/prompt";

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
 */

// Node.js runtime is the default (an explicit `runtime` export is rejected with cacheComponents).
export const maxDuration = 30;

const DEFAULT_MODEL = "gpt-6-luna";
const OPENAI_URL = "https://api.openai.com/v1/responses";

const limiter = new SlidingWindowLimiter(RATE_RULES);
const globalLimiter = new SlidingWindowLimiter([GLOBAL_RULE], 1);

type Mode = "live" | "mock" | "offline";

function mode(): Mode {
  if (process.env.AYAN_BOT_MOCK === "1") return "mock";
  if (process.env.OPENAI_API_KEY) return "live";
  return process.env.NODE_ENV === "production" ? "offline" : "mock";
}

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
) {
  const body: Record<string, unknown> = {
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    instructions: SYSTEM_PROMPT,
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

/** Converts the Responses API SSE stream into a plain text stream of output deltas. */
function relay(upstream: ReadableStream<Uint8Array>) {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = upstream.getReader();
      try {
        for (;;) {
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
              let evt: { type?: string; delta?: unknown };
              try {
                evt = JSON.parse(data);
              } catch {
                continue;
              }
              if (
                evt.type === "response.output_text.delta" &&
                typeof evt.delta === "string"
              ) {
                controller.enqueue(enc.encode(evt.delta));
              } else if (evt.type === "response.incomplete") {
                controller.enqueue(enc.encode(" …"));
              } else if (
                evt.type === "error" ||
                evt.type === "response.failed"
              ) {
                controller.enqueue(
                  enc.encode(
                    "\n\n(ayan-bot lost the feed mid-sentence. Try again in a moment.)",
                  ),
                );
              }
            }
          }
        }
      } catch {
        // Client disconnected or upstream dropped; just end the stream.
      } finally {
        controller.close();
      }
    },
    cancel() {
      void reader?.cancel();
    },
  });
}

export async function POST(request: Request) {
  const m = mode();
  const h = request.headers;

  if (!isAllowedOrigin(h, SITE_URL, process.env.NODE_ENV !== "production"))
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

  // Mock mode costs nothing, so local testing isn't throttled.
  const rl =
    m === "mock" ? { ok: true, retryAfterSec: 0 } : limiter.check(clientIp(h));
  if (!rl.ok)
    return json(
      429,
      { error: "rate_limited", message: RATE_LIMIT_MESSAGE },
      m,
      { "Retry-After": String(rl.retryAfterSec) },
    );

  // Obvious injection attempts get a fixed answer and never reach the model.
  if (looksLikeInjection(question))
    return new Response(
      textStream(mockChunks(INJECTION_REFUSAL), request.signal, 18),
      { headers: streamHeaders(m) },
    );

  if (m === "offline")
    return json(503, { error: "offline", message: OFFLINE_MESSAGE }, m);

  if (m === "mock")
    return new Response(
      textStream(mockChunks(mockReply(question)), request.signal, 28),
      { headers: streamHeaders(m) },
    );

  const g = globalLimiter.check("all");
  if (!g.ok)
    return json(
      429,
      { error: "rate_limited", message: RATE_LIMIT_MESSAGE },
      m,
      { "Retry-After": String(g.retryAfterSec) },
    );

  let upstream: Response;
  try {
    upstream = await callOpenAI(history, request.signal, false);
    // If a custom OPENAI_MODEL rejects reasoning/temperature, retry once without them.
    if (upstream.status === 400) {
      void upstream.body?.cancel();
      upstream = await callOpenAI(history, request.signal, true);
    }
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return json(502, { error: "upstream", message: OFFLINE_MESSAGE }, m);
  }

  if (!upstream.ok || !upstream.body) {
    // Log status only: never the key, never the prompt.
    console.error(`[ayan-bot] OpenAI responded ${upstream.status}`);
    void upstream.body?.cancel();
    const status = upstream.status === 429 ? 503 : 502;
    return json(status, { error: "upstream", message: OFFLINE_MESSAGE }, m);
  }

  return new Response(relay(upstream.body), { headers: streamHeaders(m) });
}
