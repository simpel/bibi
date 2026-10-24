#!/usr/bin/env bash
# Parks a ticket that could not land, for the ticket loop. An open pull request is closed. Run from the main checkout:
#   tools/backlog/park.sh <N> "<issue title>"   (reason on stdin, max 30 lines are used)
# Aborts a stopped rebase, commits the work as WIP, pushes it to parked/<N> (never force), comments on the issue,
# moves the card to Parked, removes the worktree (keeps the branch) and releases the lock.
# KEEP_WORKTREE=1 (the loop's slot worktrees) keeps the worktree and lock: the slot resets it for its next ticket.
# Prints one JSON line {"state":"parked","branch"} ("" when the ticket had no commits to push). Exit code is always 0.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

N="${1:-}"
TITLE="${2:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]]; then
  emit failed "reason=usage: park.sh <N> <title>"
  exit 0
fi
REASON="$(head -30)"
DIR="$(ticket_dir "$N")"
BRANCH=""

if cd "$DIR" 2>/dev/null; then
  rebase_in_progress && git rebase --abort >/dev/null 2>&1
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    printf 'WIP (parked): #%s %s\n\nRefs #%s\n\n%s\n\n%s\n' "$N" "$TITLE" "$N" "$REASON" "$CO_AUTHOR" | git commit --quiet -F -
  fi
  if [ -n "$(git log origin/main..HEAD --oneline)" ]; then
    BRANCH="parked/$N"
    for suffix in "" -2 -3 -4 -5; do
      git show-ref --verify --quiet "refs/heads/parked/$N$suffix" || { BRANCH="parked/$N$suffix"; break; }
    done
    git branch -m "$BRANCH" >/dev/null 2>&1
    git push -u origin "$BRANCH" >/dev/null 2>&1 || BRANCH=""
  fi
fi

# An open pull request of this ticket is closed: its work now lives on the parked branch.
PR="$(pr_number_for "$N")"
if [ -n "$PR" ]; then
  gh pr close "$PR" -R "$REPO" --comment "Parked by the ticket loop; the reason is on the issue." >/dev/null 2>&1 || true
  git push origin --delete "ticket/$N" >/dev/null 2>&1 || true
fi

COMMENT="The ticket loop parked this ticket."
[ -n "$BRANCH" ] && COMMENT+=" Branch: https://github.com/simpel/bibi/tree/$BRANCH"
COMMENT+=$'\n\nReason:\n'"$REASON"
gh issue comment "$N" -R simpel/bibi --body "$COMMENT" >/dev/null 2>&1 || true
move_card "${PARKED_OPTION:-}"

cd "$MAIN" || true
if [ "${KEEP_WORKTREE:-}" != 1 ]; then
  pnpm wt:rm "t-$N" --force >/dev/null 2>&1 || true
  "$HERE/release.sh" "$N" >/dev/null 2>&1 || true
fi
emit parked "branch=$BRANCH"
