import { SITE_URL } from "@/lib/site";
import {
  clientIp,
  isAllowedOrigin,
  isCrossSiteFetch,
} from "@/lib/ayan-bot/guard";
import {
  breakerOpen,
  difficulty,
  peekRemaining,
  powDisabled,
  takeChallenge,
} from "@/lib/ayan-bot/defense";
import { clientKey, issueTicket } from "@/lib/ayan-bot/pow";
import { getStore } from "@/lib/ayan-bot/store";
import { botMode } from "@/lib/ayan-bot/mode";

/**
 * POST /api/ayan-bot/challenge: hands the widget a single-use proof-of-work
 * ticket for its next message, plus what it needs for the usage meter
 * (messages left for this visitor, and whether the live model is up).
 * POST, so it is never cached or prerendered.
 */

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  const h = request.headers;
  if (
    isCrossSiteFetch(h) ||
    !isAllowedOrigin(h, SITE_URL, process.env.NODE_ENV !== "production")
  )
    return Response.json({ error: "forbidden" }, { status: 403, headers });

  const store = getStore();
  const client = clientKey(clientIp(h), h.get("user-agent") ?? "");
  const mode = botMode();

  try {
    if (!(await takeChallenge(store, client)))
      return Response.json(
        { error: "rate_limited" },
        { status: 429, headers: { ...headers, "Retry-After": "600" } },
      );
    const [bits, remaining, tripped] = await Promise.all([
      difficulty(store),
      mode === "mock"
        ? Promise.resolve(Infinity)
        : peekRemaining(store, client),
      breakerOpen(store),
    ]);
    const t = powDisabled()
      ? { ticket: "", bits: 0, exp: 0 }
      : issueTicket(client, bits);
    return Response.json(
      {
        ...t,
        mode: tripped && mode === "live" ? "offline" : mode,
        remaining: Number.isFinite(remaining) ? remaining : null,
      },
      { headers },
    );
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
