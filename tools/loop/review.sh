#!/usr/bin/env bash
# Tenancy review of a slot's change: tools/loop/review.sh <slot> <out.json>, from inside the slot worktree.
# Runs only when the change touches REVIEW_PATHS. The session gets the diff and read-only tools, not a fresh
# exploration of the repository. Prints OK, SKIPPED, or the findings (one per line) that must be fixed.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
. "$HERE/config.sh"
SLOT="${1:-}"
OUT="${2:-}"

git add -N . >/dev/null 2>&1
if ! git diff --name-only origin/main | grep -qE "$REVIEW_PATHS"; then
  echo SKIPPED
  exit 0
fi
DIFF="$(git diff origin/main | head -4000)"
LOOP_TOOLS="Read,Grep,Glob"
run_claude "$OUT" "$REVIEW_MODEL" high "$REVIEW_BUDGET_USD" <<PROMPT
Review this change for multi-tenant leaks, permissions, audit and AI approval, following
.claude/skills/tenancy-review/SKILL.md. Read files only where the diff is not enough.
Reply with exactly OK on the first line when nothing must change. Otherwise list each finding that must be fixed
as one line: <file>:<line> <problem> -> <fix>. Nothing else.

$DIFF
PROMPT
jq -r '.result // "OK"' "$OUT" 2>/dev/null || echo OK
