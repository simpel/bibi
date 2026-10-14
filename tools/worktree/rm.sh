#!/usr/bin/env bash
# Remove a worktree and drop its database: pnpm wt:rm <name> [--force] [--delete-branch]
# Refuses a worktree with uncommitted changes unless --force. The branch is kept by default.
set -euo pipefail
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPTS/lib.sh"

NAME="${1:-}"
shift || true
FORCE=""
DELETE_BRANCH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --force) FORCE="--force"; shift ;;
    --delete-branch) DELETE_BRANCH=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
DIR="$WORKTREES_DIR/$NAME"
if [ -z "$NAME" ] || [ ! -d "$DIR" ]; then
  echo "Usage: pnpm wt:rm <name> [--force] [--delete-branch]  (no worktree at $DIR)" >&2
  exit 1
fi
if [ -z "$FORCE" ] && [ -n "$(git -C "$DIR" status --porcelain)" ]; then
  echo "$DIR has uncommitted changes. Commit them or pass --force." >&2
  exit 1
fi

BRANCH="$(git -C "$DIR" branch --show-current)"
(cd "$DIR" && "$SCRIPTS/teardown.sh")
git -C "$MAIN_ROOT" worktree remove $FORCE "$DIR"
if [ -n "$DELETE_BRANCH" ] && [ -n "$BRANCH" ]; then
  git -C "$MAIN_ROOT" branch -D "$BRANCH"
fi
echo "Removed $DIR"
