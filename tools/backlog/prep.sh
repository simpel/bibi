#!/usr/bin/env bash
# Worktree preparation for the work-backlog workflow: tools/backlog/prep.sh [--adopt] <issue-number>
# --adopt takes over the worktree and lock of a run that died, KEEPING its uncommitted work, and prints
# WORKTREE_DIR=<path>. Use it only when the run that holds the lock is dead; it never deletes anything.
# Creates ../bibi-worktrees/t-<N> on branch ticket/<N> from origin/main, after clearing leftovers
# from an earlier run that hold no work. Prints WORKTREE_DIR=<path> on success, PROBLEM=<reason>
# and exit 1 otherwise. Run from the main checkout.
# Refuses closed issues, and takes a per-ticket lock (a directory in bibi-worktrees/.locks, atomic mkdir)
# so two runs or agents never prepare or write in the same worktree. The land and park steps release it with
# tools/backlog/release.sh. A lock older than LOCK_MAX_AGE_MIN (default 720) is treated as stale.
set -uo pipefail
ADOPT=0
if [ "${1:-}" = "--adopt" ]; then ADOPT=1; shift; fi
N="${1:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]]; then
  echo "PROBLEM=usage: tools/backlog/prep.sh <issue-number>"
  exit 1
fi
MAIN="$(git rev-parse --show-toplevel)"
NAME="t-$N"
BRANCH="ticket/$N"
DIR="$(dirname "$MAIN")/bibi-worktrees/$NAME"
fail() { echo "PROBLEM=$1"; exit 1; }

cd "$MAIN" || fail "no main checkout"
git fetch origin --quiet || fail "git fetch failed"

STATE="$(gh issue view "$N" -R simpel/bibi --json state --jq .state 2>/dev/null)" || fail "could not read state of issue #$N"
[ "$STATE" = "OPEN" ] || fail "issue #$N is $STATE, not OPEN"

LOCKS="$(dirname "$MAIN")/bibi-worktrees/.locks"
LOCK="$LOCKS/$NAME"
mkdir -p "$LOCKS" || fail "could not create $LOCKS"
if [ "$ADOPT" = 1 ]; then
  [ -d "$DIR" ] || fail "nothing to adopt: $DIR does not exist"
  [ "$(git -C "$DIR" branch --show-current)" = "$BRANCH" ] || fail "worktree $DIR is not on $BRANCH"
  rm -rf "$LOCK"
  mkdir "$LOCK" 2>/dev/null || fail "could not take the lock $LOCK"
  echo "WORKTREE_DIR=$DIR"
  exit 0
fi
if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +"${LOCK_MAX_AGE_MIN:-720}")" ]; then
  rmdir "$LOCK" 2>/dev/null || rm -rf "$LOCK"
fi
mkdir "$LOCK" 2>/dev/null || fail "ticket #$N is locked by another run or agent ($LOCK); remove it only if that run is dead"
trap '[ "${OK:-0}" = 1 ] || rmdir "$LOCK" 2>/dev/null' EXIT

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
OK=1
grep '^WORKTREE_DIR=' "$LOG" | tail -1
