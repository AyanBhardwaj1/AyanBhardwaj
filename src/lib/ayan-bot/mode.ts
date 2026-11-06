/**
 * Server-only. How ayan-bot answers right now:
 * - "live": the OpenAI model (key present, not disabled).
 * - "mock": canned replies, no API calls (AYAN_BOT_MOCK=1, or dev without a key).
 * - "offline": no model (no key in production, or AYAN_BOT_DISABLED=1, the
 *   kill switch); quick briefs still answer the common questions.
 */
export type BotMode = "live" | "mock" | "offline";

export function botMode(env = process.env): BotMode {
  if (env.AYAN_BOT_DISABLED === "1") return "offline";
  if (env.AYAN_BOT_MOCK === "1") return "mock";
  if (env.OPENAI_API_KEY) return "live";
  return env.NODE_ENV === "production" ? "offline" : "mock";
}
