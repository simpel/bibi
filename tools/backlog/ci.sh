#!/usr/bin/env bash
# Waits for the CI checks of a ticket's pull request, for the ticket loop and by hand. Run from the main checkout:
#   tools/backlog/ci.sh <N> [--timeout <seconds>]   (default 540, so one call stays under a 10 minute tool limit)
# Polls every 30 seconds. Prints one JSON line:
#   {"state":"green"}  {"state":"red","failed":"<names>","log":"<last lines of the failed run>"}
#   {"state":"pending"} (budget used up: call again)  {"state":"failed","reason"}
# Checks that are skipped count as passing; a cancelled run is treated as still pending (a newer push replaced it).
# Exit code is always 0.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

N="${1:-}"
TIMEOUT=540
[ "${2:-}" = "--timeout" ] && TIMEOUT="${3:-540}"
if ! [[ "$N" =~ ^[0-9]+$ ]]; then
  emit failed "reason=usage: ci.sh <N> [--timeout <seconds>]"
  exit 0
fi
PR="$(pr_number_for "$N")"
[ -n "$PR" ] || { emit failed "reason=no open pull request for ticket/$N"; exit 0; }

START="$(date +%s)"
while :; do
  CHECKS="$(gh pr checks "$PR" -R "$REPO" --json name,bucket 2>/dev/null || echo '[]')"
  [ -n "$CHECKS" ] || CHECKS='[]'
  FAILED="$(jq -r '[.[] | select(.bucket=="fail") | .name] | join(", ")' <<<"$CHECKS")"
  if [ -n "$FAILED" ]; then
    RUN="$(gh run list -R "$REPO" --branch "ticket/$N" -L 10 --json databaseId,conclusion -q '[.[] | select(.conclusion=="failure")][0].databaseId // empty' 2>/dev/null)"
    LOG=""
    [ -n "$RUN" ] && LOG="$(gh run view "$RUN" -R "$REPO" --log-failed 2>/dev/null | tail -120)"
    jq -nc --arg failed "$FAILED" --arg log "$LOG" '{state:"red",failed:$failed,log:$log}'
    exit 0
  fi
  TOTAL="$(jq 'length' <<<"$CHECKS")"
  PENDING="$(jq '[.[] | select(.bucket=="pending" or .bucket=="cancel")] | length' <<<"$CHECKS")"
  if [ "$TOTAL" -gt 0 ] && [ "$PENDING" -eq 0 ]; then
    emit green
    exit 0
  fi
  if [ $(( $(date +%s) - START )) -ge "$TIMEOUT" ]; then
    emit pending
    exit 0
  fi
  sleep "${CI_POLL_SECONDS:-30}"
done
