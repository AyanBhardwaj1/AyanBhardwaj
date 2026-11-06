#!/usr/bin/env bash
# Browser smoke tests for the whole site against a production build.
#
#   npm run build          # once
#   npm run test:smoke     # or: bash scripts/smoke/run.sh
#
# Starts `next start` on 127.0.0.1:3041 (loopback only) with ayan-bot in mock
# mode (no API key, no spend), runs scripts/smoke/*.test.mjs in headless
# Chromium (Playwright, preinstalled globally), stops the server and exits
# non-zero if any check failed. Override the port with SMOKE_PORT.
set -u
cd "$(dirname "$0")/../.."
D=scripts/smoke
PORT=${SMOKE_PORT:-3041}
BASE=http://127.0.0.1:$PORT
T0=$(date +%s)

if [ ! -f .next/BUILD_ID ]; then
  echo "smoke: no production build found. Run \`npm run build\` first."
  exit 2
fi
if curl -s -o /dev/null --max-time 2 "$BASE/"; then
  echo "smoke: something is already listening on $BASE. Set SMOKE_PORT."
  exit 2
fi

LOG=$(mktemp "${TMPDIR:-/tmp}/smoke-next.XXXXXX")
# Own process group, so stopping it also stops the next-server child.
setsid env AYAN_BOT_MOCK=1 \
  npx next start -H 127.0.0.1 -p "$PORT" > "$LOG" 2>&1 &
NP=$!

stop_server() {
  kill -- -"$NP" 2>/dev/null
  wait "$NP" 2>/dev/null
}
trap 'stop_server; rm -f "$LOG"' EXIT
trap 'exit 130' INT TERM

# Wait (up to 60 s) until the server answers.
up=0
for _ in $(seq 1 120); do
  if curl -s -o /dev/null --max-time 2 "$BASE/"; then
    up=1
    break
  fi
  if ! kill -0 "$NP" 2>/dev/null; then break; fi
  sleep 0.5
done
if [ "$up" -ne 1 ]; then
  echo "smoke: server did not start on $BASE. Log:"
  tail -n 40 "$LOG"
  exit 1
fi

FAILED=0
RES=$(mktemp "${TMPDIR:-/tmp}/smoke-res.XXXXXX")
for t in "$D"/*.test.mjs; do
  SMOKE_BASE=$BASE SMOKE_RESULT=$RES node --no-warnings "$t" || FAILED=1
done
# Each test file appends "<passed> <failed>" to $RES.
read -r P F <<< "$(awk '{p+=$1; f+=$2} END {print p+0, f+0}' "$RES")"
rm -f "$RES"

if [ "$FAILED" -ne 0 ]; then
  echo "smoke: server log (last 20 lines):"
  tail -n 20 "$LOG"
fi
echo "smoke: $([ "$FAILED" -eq 0 ] && echo PASSED || echo FAILED): $P passed, $F failed in $(($(date +%s) - T0))s"
exit "$FAILED"
