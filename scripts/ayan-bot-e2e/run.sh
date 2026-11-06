#!/usr/bin/env bash
# End-to-end tests for ayan-bot's defenses against a local fake OpenAI (and,
# optionally, a fake Upstash). No real API calls, no credits spent.
#
#   npm run build                              # once
#   scripts/ayan-bot-e2e/run.sh                # all suites
#
# Each suite gets a fresh `next start` on :3031 with its own environment.
set -u
cd "$(dirname "$0")/../.."
D=scripts/ayan-bot-e2e
FAKE_KEY=fake-openai-key-for-local-tests
UP=(UPSTASH_REDIS_REST_URL=http://127.0.0.1:4556 UPSTASH_REDIS_REST_TOKEN=tok123)
FAILED=0

suite() {
  local name=$1 test=$2 fake=$3; shift 3
  echo "== $name"
  FAKE_MODE=$fake node $D/fake-openai.mjs & local fp=$!
  node $D/fake-upstash.mjs & local up=$!
  # Own process group, so stopping it also stops the next-server child.
  setsid env OPENAI_API_KEY=$FAKE_KEY AYAN_BOT_UPSTREAM_URL=http://127.0.0.1:4555/v1/responses "$@" \
    npx next start -p 3031 > /dev/null 2>&1 & local np=$!
  sleep 4
  node --no-warnings $D/$test || FAILED=1
  kill -- -$np 2>/dev/null
  kill $fp $up 2>/dev/null
  wait $fp $up 2>/dev/null
  sleep 1
}

suite "security (memory store)" security.test.mts ok
suite "security (shared store)" security.test.mts ok "${UP[@]}"
suite "daily budget" budget.test.mts ok "${UP[@]}" AYAN_BOT_DAILY_BUDGET_USD=0.002
suite "monthly budget" budget.test.mts ok AYAN_BOT_MONTHLY_BUDGET_USD=0.002
suite "concurrent burst vs budget" burst.test.mts ok "${UP[@]}" AYAN_BOT_DAILY_BUDGET_USD=0.002
suite "circuit breaker" breaker.test.mts fail
suite "store unreachable fails closed" store-down.test.mts ok \
  UPSTASH_REDIS_REST_URL=http://127.0.0.1:4599 UPSTASH_REDIS_REST_TOKEN=tok123

if [ "$FAILED" -ne 0 ]; then
  echo "ayan-bot e2e: FAILED"
  exit 1
fi
echo "ayan-bot e2e: all suites passed"
