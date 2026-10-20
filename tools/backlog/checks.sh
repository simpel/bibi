#!/usr/bin/env bash
# The full checks for the work-backlog workflow: run from inside a ticket worktree.
# Order is cheapest first: lint, check:structure and typecheck always run (a failure is known in seconds
# and all three are reported); db:migrate and test only run when those are green, since they would just repeat
# the problem. Prints one JSON line: {"green":bool,"failures":[{"check","output"}]} (output = last 60 lines).
# Exit code is always 0 so a caller reads the JSON, not the status.
# --light runs only lint and check:structure (documentation and decision tickets change no code).
set -uo pipefail
LIGHT=0
[ "${1:-}" = "--light" ] && LIGHT=1
MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
[ "$LIGHT" = 1 ] || docker compose -p okazi -f "$MAIN/docker-compose.yml" up -d --wait postgres >/dev/null 2>&1 || true

FAILURES="$(mktemp)"
trap 'rm -f "$FAILURES"' EXIT
run() {
  local name="$1"
  shift
  local out
  if ! out="$("$@" 2>&1)"; then
    jq -nc --arg check "$name" --arg output "$(printf '%s\n' "$out" | tail -60)" '{check:$check,output:$output}' >>"$FAILURES"
  fi
}

run "pnpm lint" pnpm lint
run "pnpm check:structure" pnpm check:structure
if [ "$LIGHT" = 0 ]; then
  run "pnpm typecheck" pnpm typecheck
fi
if [ "$LIGHT" = 0 ] && [ ! -s "$FAILURES" ]; then
  run "pnpm db:migrate" pnpm db:migrate
  run "pnpm test" pnpm test
fi

jq -sc '{green:(length==0),failures:.}' "$FAILURES"
