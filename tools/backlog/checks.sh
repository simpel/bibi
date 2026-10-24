#!/usr/bin/env bash
# The checks for the ticket loop (tools/loop/verify.sh) and ship.sh: run from inside a ticket worktree. The checks are defined once in
# tools/ci/checks.json and run by tools/ci/verify.mjs (CI runs the same file with --all), scoped here to the files the
# ticket changed: lint, check:structure and typecheck always run and are all reported; db:migrate and the tests run when
# those are green; the build runs when apps or shared packages changed, and Storybook when packages/ui changed.
# Prints one JSON line: {"green":bool,"failures":[{"check","output"}]} (output = last 60 lines).
# Exit code is always 0 so a caller reads the JSON, not the status.
# --light runs only lint and check:structure (documentation and decision tickets change no code).
set -uo pipefail
MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
ARGS=(--json --base origin/main)
if [ "${1:-}" = "--light" ]; then
  ARGS+=(--light)
else
  docker compose -p bibi -f "$MAIN/docker-compose.yml" up -d --wait postgres >/dev/null 2>&1 || true
  # Storybook has its own CI job; a ticket that changes packages/ui builds it here too.
  CHANGED="$(git diff --name-only origin/main...HEAD; git diff --name-only HEAD; git ls-files --others --exclude-standard)"
  if grep -q '^packages/ui/' <<<"$CHANGED"; then STORYBOOK=1; fi
fi
REPORT="$(node "$MAIN/tools/ci/verify.mjs" "${ARGS[@]}" | tail -1)"
if [ "${STORYBOOK:-0}" = 1 ] && [ "$(jq -r .green <<<"$REPORT")" = true ]; then
  SB="$(node "$MAIN/tools/ci/verify.mjs" --json --only storybook | tail -1)"
  [ "$(jq -r .green <<<"$SB")" = true ] || REPORT="$SB"
fi
jq -c '{green,failures}' <<<"$REPORT"
