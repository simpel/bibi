#!/usr/bin/env bash
# The checks a loop session runs until green: tools/loop/verify.sh, from inside the slot worktree.
# Runs tools/backlog/checks.sh (the CI checks, scoped to the changed files) and seed:demo when seed data or the
# schema changed. Prints GREEN, or each failing check with the last 40 lines of its output. Exit 0 when green, 1 otherwise.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIGHT=()
[ "${CHECKS_ARGS:-}" = "--light" ] && LIGHT=(--light)

REPORT="$("$HERE/../backlog/checks.sh" "${LIGHT[@]}" | tail -1)"
if [ "$(jq -r .green <<<"$REPORT" 2>/dev/null)" != true ]; then
  jq -r '.failures[] | "FAILED: \(.check)\n\(.output | split("\n") | .[-40:] | join("\n"))\n"' <<<"$REPORT" 2>/dev/null \
    || echo "FAILED: checks.sh printed no report"
  exit 1
fi

CHANGED="$(git diff --name-only origin/main; git ls-files --others --exclude-standard)"
if [ -z "${LIGHT[*]}" ] && grep -qE '^packages/(core/src/seed|db/prisma)/' <<<"$CHANGED"; then
  if ! OUT="$(pnpm --filter @bibi/core seed:demo 2>&1)"; then
    printf 'FAILED: seed:demo\n%s\n' "$(tail -40 <<<"$OUT")"
    exit 1
  fi
fi
echo GREEN
