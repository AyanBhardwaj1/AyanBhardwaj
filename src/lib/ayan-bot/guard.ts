/**
 * ayan-bot guard rails. Pure functions with no imports, so they run in the
 * route handler, in the client (limits only) and in a plain `node` unit test.
 *
 * Scope is enforced by the system prompt (see prompt.ts). These checks are the
 * cheap server-side layer in front of it: input caps, history trimming, an
 * obvious prompt-injection filter (answered without calling the model at all),
 * a best-effort rate limiter and a same-origin check.
 */

export const LIMITS = {
  /** Max characters in one user message. */
  userChars: 500,
  /** Max characters kept from one earlier assistant reply. */
  assistantChars: 2000,
  /** Max messages of history sent to the model (user + assistant). */
  historyMessages: 12,
  /** Max raw request body, in bytes. */
  bodyBytes: 16_384,
  /** Max model output tokens per reply. */
  outputTokens: 400,
} as const;

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export const REFUSAL =
  "That's outside my lane. I'm ayan-bot, and I only cover Ayan: his projects, his work at Moss and Koyal AI, his skills, the CSB program, and how to reach him. Ask me about any of that. <GO>";

export const INJECTION_REFUSAL =
  "Nice try. My instructions stay where they are, and I stay on one topic: Ayan. Want to hear about YouBank or the 10 apps he shipped at Moss instead? <GO>";

export const OFFLINE_MESSAGE =
  "ayan-bot is offline right now. The terminal's dark, but the inbox isn't: email Ayan at ayan.bhardwaj@utexas.edu, or press ⌘K to browse his work. <GO>";

export const RATE_LIMIT_MESSAGE =
  "Easy, the tape's moving fast. You've hit ayan-bot's message limit for now. Give it a few minutes, or email Ayan directly at ayan.bhardwaj@utexas.edu.";

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; status: number; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Control, zero-width and bidi-override characters. Built from a string so the
// compiler never inlines the Unicode line/paragraph separators into a regex
// literal (a syntax error).
const INVISIBLE = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u2028\\u2029\\u202A-\\u202E\\u2060-\\u2064\\uFEFF]",
  "g",
);

/** Strip control characters (keep newlines and tabs) and collapse runaway whitespace. */
export function cleanText(s: string): string {
  return s
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Validate and normalise the request body into a model-ready history.
 * Keeps the last LIMITS.historyMessages messages, which must end on a user turn.
 */
export function parseChatBody(body: unknown): Ok<ChatMessage[]> | Err {
  if (!isRecord(body) || !Array.isArray(body.messages))
    return { ok: false, status: 400, error: "bad_request" };
  const raw = body.messages as unknown[];
  if (raw.length === 0 || raw.length > 64)
    return { ok: false, status: 400, error: "bad_request" };

  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (!isRecord(m)) return { ok: false, status: 400, error: "bad_request" };
    const { role, content } = m;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string"
    )
      return { ok: false, status: 400, error: "bad_request" };
    const text = cleanText(content);
    if (!text) continue;
    out.push({
      role,
      content: role === "user" ? text : text.slice(0, LIMITS.assistantChars),
    });
  }

  const last = out.at(-1);
  if (!last || last.role !== "user")
    return { ok: false, status: 400, error: "bad_request" };
  if (last.content.length > LIMITS.userChars)
    return { ok: false, status: 413, error: "message_too_long" };

  // Older user turns are clipped rather than rejected.
  const trimmed = out
    .slice(-LIMITS.historyMessages)
    .map((m) =>
      m.role === "user"
        ? { ...m, content: m.content.slice(0, LIMITS.userChars) }
        : m,
    );
  // History must start on a user turn for a clean transcript.
  while (trimmed.length > 1 && trimmed[0].role !== "user") trimmed.shift();
  return { ok: true, value: trimmed };
}

/**
 * Obvious prompt-injection / jailbreak attempts. Answered with a fixed
 * in-character line and never sent to the model. Deliberately narrow: the
 * system prompt handles subtler cases.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget|override|bypass)\b[^.?!\n]{0,40}\b(previous|prior|above|earlier|all|your|the|system)\b[^.?!\n]{0,30}\b(instructions?|prompts?|rules?|guidelines?|directions?|context)\b/i,
  /\b(reveal|show|print|repeat|output|leak|display|tell me|what (is|are|was))\b[^.?!\n]{0,30}\b(your|the)\b[^.?!\n]{0,20}\b(system prompt|system message|instructions|initial prompt|hidden prompt|developer message)\b/i,
  /\bsystem prompt\b/i,
  /\b(jailbreak|DAN mode|developer mode|god mode)\b/i,
  /\byou are (now|no longer)\b/i,
  /\b(pretend|act|roleplay|role-play)\b[^.?!\n]{0,20}\b(to be|as|you('re| are))\b[^.?!\n]{0,40}\b(unrestricted|unfiltered|different (ai|assistant|bot)|chatgpt|gpt|another|evil)\b/i,
  /<\/?\s*(system|instructions?|developer)\s*>/i,
  /\bnew (instructions|rules)\s*:/i,
  // Chat-template and role markers pasted in to fake a turn boundary.
  /<\|(im_start|im_end|system|endoftext)\|>|\[\/?INST\]|<<\/?SYS>>/i,
  /(^|\n)\s*(#{1,3}\s*)?(system|assistant|developer)\s*:/i,
  // Asking for the hidden setup in other words.
  /\b(your|the) (initial|original|hidden|secret|internal) (prompt|instructions|rules|context|configuration)\b/i,
  /\b(print|dump|repeat|output|echo)\b[^.?!\n]{0,30}\b(everything|all text|the text|verbatim)\b[^.?!\n]{0,30}\b(above|before|so far)\b/i,
  /\bapi[ _-]?key\b|\benv(ironment)? var(iable)?s?\b|\bprocess\.env\b/i,
];

/** Long base64-ish blobs: smuggled instructions or payloads, never a real question. */
const BLOB = /[A-Za-z0-9+/=_-]{120,}/;

export function looksLikeInjection(text: string): boolean {
  const flat = text.replace(/\s+/g, " ");
  return BLOB.test(text) || INJECTION_PATTERNS.some((re) => re.test(flat));
}

// ---------- Output guard ----------

/**
 * Stops a reply that leaks what it shouldn't: the system prompt's canary
 * token (only present if the model is quoting its instructions), lines of
 * the instructions themselves, or anything shaped like a secret key.
 */
const LEAK_PATTERNS: RegExp[] = [
  /\bsk-(proj-|svcacct-|admin-)?[A-Za-z0-9_-]{16,}/,
  /\b(AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /# DOSSIER \(the only facts/i,
  /SCOPE \(strict\)/,
  /Out of scope includes:/,
];

export function leaks(text: string, canary: string): boolean {
  return (
    (canary !== "" && text.includes(canary)) ||
    LEAK_PATTERNS.some((re) => re.test(text))
  );
}

export const LEAK_REFUSAL =
  "\n\n(ayan-bot stopped that reply: it started heading somewhere it shouldn't. Ask me about Ayan's work instead. <GO>)";

export const BUDGET_MESSAGE =
  "ayan-bot has used up its thinking budget for today, so the live model is resting. The quick briefs still work, and Ayan's inbox never closes: ayan.bhardwaj@utexas.edu. <GO>";

// ---------- Rate limiting ----------

export type RateRule = { windowMs: number; max: number };

export const RATE_RULES: RateRule[] = [
  { windowMs: 10 * 60_000, max: 10 },
  { windowMs: 24 * 60 * 60_000, max: 60 },
];

/** Per-instance ceiling across all visitors, a backstop for the OpenAI bill. */
export const GLOBAL_RULE: RateRule = { windowMs: 24 * 60 * 60_000, max: 1500 };

/**
 * Best-effort in-memory sliding window. On serverless each instance keeps its
 * own map, so this throttles casual abuse, not a determined attacker; the
 * OpenAI dashboard usage cap is the real ceiling.
 */
export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();
  private rules: RateRule[];
  private maxKeys: number;
  constructor(rules: RateRule[], maxKeys = 5000) {
    this.rules = rules;
    this.maxKeys = maxKeys;
  }

  /** Records a hit and returns whether it is allowed (and when to retry if not). */
  check(key: string, now = Date.now()): { ok: boolean; retryAfterSec: number } {
    const longest = Math.max(...this.rules.map((r) => r.windowMs));
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < longest);
    for (const r of this.rules) {
      const inWindow = list.filter((t) => now - t < r.windowMs);
      if (inWindow.length >= r.max) {
        this.hits.set(key, list);
        const retry = r.windowMs - (now - inWindow[0]);
        return {
          ok: false,
          retryAfterSec: Math.max(1, Math.ceil(retry / 1000)),
        };
      }
    }
    list.push(now);
    this.hits.delete(key);
    this.hits.set(key, list);
    // Evict the oldest keys (Map keeps insertion order) so memory stays bounded.
    while (this.hits.size > this.maxKeys) {
      const first = this.hits.keys().next().value;
      if (first === undefined) break;
      this.hits.delete(first);
    }
    return { ok: true, retryAfterSec: 0 };
  }
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(headers: {
  get(name: string): string | null;
}): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headers.get("x-real-ip")?.trim();
  return real ? real.slice(0, 64) : "unknown";
}

// ---------- Same-origin ----------

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const hostOf = (u: string | null): string | null => {
  if (!u) return null;
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * The browser's Origin (or Referer) must be this deployment's own host, the
 * public site URL, or (outside production) localhost. Requests with neither header are rejected:
 * browsers always send Origin on a cross-site or same-site fetch POST.
 */
/**
 * Fetch metadata: browsers label every request with Sec-Fetch-Site. A
 * cross-site value means another site is driving the visitor's browser at
 * this endpoint; refuse it. (Absent on non-browser clients, which the
 * Origin check and proof-of-work handle.)
 */
export function isCrossSiteFetch(headers: {
  get(name: string): string | null;
}): boolean {
  const site = headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin" && site !== "same-site";
}

export function isAllowedOrigin(
  headers: { get(name: string): string | null },
  siteUrl: string,
  allowLocal = true,
): boolean {
  const from = hostOf(headers.get("origin")) ?? hostOf(headers.get("referer"));
  if (!from) return false;
  const allowed = new Set<string>();
  const site = hostOf(siteUrl);
  if (site) allowed.add(site);
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) allowed.add(host.split(",")[0].trim().toLowerCase());
  if (allowed.has(from)) return true;
  const hostname = from.replace(/:\d+$/, "");
  return allowLocal && LOCAL_HOSTS.has(hostname);
}
