# ayan-bot: security and spend controls

ayan-bot is the chat agent on the site. It answers only about Ayan, from the
same content the site renders (`src/lib/ayan-bot/prompt.ts`), using the
OpenAI Responses API. This page is for whoever runs the deployment.

## Set up (production)

1. **OpenAI**: create a project key and set `OPENAI_API_KEY` in Vercel
   (Production only). In the OpenAI dashboard, also set a **monthly budget**
   on that project: it is the final backstop if everything else failed.
2. **Shared counters**: Vercel > Storage / Marketplace > **Upstash for Redis**
   (free tier is plenty), connected to this project. It sets
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without it,
   budgets and rate limits are kept per server instance, which a burst of
   traffic across many instances can exceed.
3. **Budgets** (optional): `AYAN_BOT_DAILY_BUDGET_USD` (default 0.50) and
   `AYAN_BOT_MONTHLY_BUDGET_USD` (default 5).
4. Redeploy. The widget's footer shows how many messages a visitor has left.

Kill switch: set `AYAN_BOT_DISABLED=1` and redeploy. ayan-bot keeps answering
the common questions from free canned briefs and makes no model calls.

## How the spend cap works

- Before every model call, the route reserves the **worst-case** cost of that
  request (estimated input tokens, generously rounded, plus the full 400-token
  output cap) against both the day's and the month's budget, with an atomic
  `INCRBY`. If either total would go over, the request is answered from the
  canned briefs instead and the model is never called.
- When the reply finishes, the reservation is settled down to the real cost
  from the API's usage report. If no usage report arrives, the full
  reservation stays counted (over-counting is the safe direction).
- If the shared store is configured but unreachable, the route **fails
  closed**: no reservation, no model call.
- Proof-of-work tickets get harder (15 → 17 → 18 bits) once the day's spend
  passes 50% and 80% of the daily budget.
- Prices: gpt-6-luna list prices by default. Any other `OPENAI_MODEL` is priced
  at $2.50 / $10 per 1M tokens unless `AYAN_BOT_PRICE_IN_PER_M` /
  `AYAN_BOT_PRICE_OUT_PER_M` are set, so a pricier model can't silently blow
  through the cap.

## Request defenses, in order

1. **Fetch metadata and origin**: requests labelled `Sec-Fetch-Site:
cross-site`, or whose `Origin` isn't this site, are refused (403).
2. **Shape and size**: JSON only, 16 KB body cap, 500-character messages,
   12 messages of history, control/zero-width/bidi characters stripped, NFKC
   normalised.
3. **Proof-of-work ticket**: `POST /api/ayan-bot/challenge` issues an
   HMAC-signed ticket bound to a salted hash of the visitor's IP and user
   agent, valid 5 minutes, usable once. The browser solves it in the
   background (about 0.1 s on a laptop) before each message. Scripts have to
   pay that cost for every single request, and can't reuse or share tickets.
4. **Rate limits**: per visitor, 10 messages per 10 minutes and 40 per day
   (shared store), plus per-instance limits and a per-instance daily ceiling.
5. **Injection filter**: obvious jailbreaks, chat-template markers, fake role
   lines, requests for keys or environment variables and long encoded blobs
   get a fixed in-character answer and never reach the model.
6. **Circuit breaker**: 5 upstream failures within a minute switch the bot to
   briefs-only for 5 minutes.
7. **Output guard**: the system prompt carries a random canary marker. The
   route holds back the last few characters of the stream and cuts the reply
   if it contains the canary, lines of the instructions, or anything shaped
   like an API key or token.
8. **Privacy**: the route logs status codes only. Never the key, the prompt or
   visitors' messages. Visitor identifiers in the store are salted hashes that
   expire with their windows.

## Testing without spending credits

```bash
npm run build
npm run test:bot
```

`scripts/ayan-bot-e2e/` starts a fake OpenAI server (and a fake Upstash) on
loopback and runs the real route through every defense above: tickets,
replay, origin, injection, the output guard, rate limits, daily and monthly
budgets, a concurrent burst against the budget, the breaker, and an
unreachable store. `AYAN_BOT_UPSTREAM_URL` only accepts loopback addresses,
so the API key can never be sent anywhere else.
