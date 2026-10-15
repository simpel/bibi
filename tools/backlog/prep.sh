#!/usr/bin/env bash
# Worktree preparation for the work-backlog workflow: tools/backlog/prep.sh <issue-number>
# Creates ../okazi-worktrees/t-<N> on branch ticket/<N> from origin/main, after clearing leftovers
# from an earlier run that hold no work. Prints WORKTREE_DIR=<path> on success, PROBLEM=<reason>
# and exit 1 otherwise. Run from the main checkout.
set -uo pipefail
N="${1:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]]; then
  echo "PROBLEM=usage: tools/backlog/prep.sh <issue-number>"
  exit 1
fi
MAIN="$(git rev-parse --show-toplevel)"
NAME="t-$N"
BRANCH="ticket/$N"
DIR="$(dirname "$MAIN")/okazi-worktrees/$NAME"
fail() { echo "PROBLEM=$1"; exit 1; }

cd "$MAIN" || fail "no main checkout"
git fetch origin --quiet || fail "git fetch failed"

if [ -d "$DIR" ]; then
  if [ -n "$(git -C "$DIR" status --porcelain)" ] || [ -n "$(git -C "$DIR" log origin/main..HEAD --oneline)" ]; then
    fail "leftover worktree with work"
  fi
  pnpm wt:rm "$NAME" --force --delete-branch >/dev/null 2>&1 || fail "could not remove leftover worktree"
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  [ -n "$(git log "origin/main..$BRANCH" --oneline)" ] && fail "leftover branch with work"
  git branch -D "$BRANCH" >/dev/null || fail "could not delete leftover branch"
fi

LOG="$(mktemp)"
if ! pnpm wt:new "$NAME" --branch "$BRANCH" --base origin/main >"$LOG" 2>&1; then
  echo "PROBLEM=pnpm wt:new failed"
  tail -30 "$LOG"
  exit 1
fi
grep '^WORKTREE_DIR=' "$LOG" | tail -1
