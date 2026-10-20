#!/usr/bin/env bash
# Waits for CI of the current origin/main, for the work-backlog workflow's main-health step (two tickets that were each
# green can still break each other after a squash merge). Run from the main checkout:
#   tools/backlog/main-ci.sh [--timeout <seconds>]   (default 540, so one call stays under a 10 minute tool limit)
# Finds the ci.yml run of origin/main's head commit and polls every 30 seconds. Prints one JSON line:
#   {"state":"green","sha"}  {"state":"red","sha","url"}  {"state":"pending","sha"} (budget used up: call again)
#   {"state":"failed","reason"}
# A cancelled run (a newer push replaced it) counts as pending. Exit code is always 0.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

TIMEOUT=540
[ "${1:-}" = "--timeout" ] && TIMEOUT="${2:-540}"
git -C "$MAIN" fetch origin main --quiet || { emit failed "reason=git fetch failed"; exit 0; }
SHA="$(git -C "$MAIN" rev-parse origin/main)"

START="$(date +%s)"
while :; do
  RUN="$(gh run list -R "$REPO" --workflow ci.yml --branch main -L 10 --json headSha,status,conclusion,url 2>/dev/null \
    | jq -c --arg sha "$SHA" '[.[] | select(.headSha==$sha)][0] // empty' 2>/dev/null)"
  if [ -n "$RUN" ] && [ "$(jq -r .status <<<"$RUN")" = completed ]; then
    CONCLUSION="$(jq -r .conclusion <<<"$RUN")"
    if [ "$CONCLUSION" = success ]; then
      jq -nc --arg sha "$SHA" '{state:"green",sha:$sha}'
      exit 0
    elif [ "$CONCLUSION" != cancelled ]; then
      jq -nc --arg sha "$SHA" --arg url "$(jq -r .url <<<"$RUN")" '{state:"red",sha:$sha,url:$url}'
      exit 0
    fi
  fi
  if [ $(( $(date +%s) - START )) -ge "$TIMEOUT" ]; then
    jq -nc --arg sha "$SHA" '{state:"pending",sha:$sha}'
    exit 0
  fi
  sleep "${CI_POLL_SECONDS:-30}"
done
