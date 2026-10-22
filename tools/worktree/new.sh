#!/usr/bin/env bash
# Create a worktree with its own environment: pnpm wt:new <name> [--base <ref>] [--branch <branch>]
# Lands in ../bibi-worktrees/<name> on branch wt/<name> (from main) unless told otherwise.
set -euo pipefail
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPTS/lib.sh"

NAME="${1:-}"
shift || true
BASE="main"
BRANCH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
if ! [[ "$NAME" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Usage: pnpm wt:new <name> [--base <ref>] [--branch <branch>]  (name: a-z, 0-9, -)" >&2
  exit 1
fi
BRANCH="${BRANCH:-wt/$NAME}"
DIR="$WORKTREES_DIR/$NAME"

require_docker
mkdir -p "$WORKTREES_DIR"
if git -C "$MAIN_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$MAIN_ROOT" worktree add "$DIR" "$BRANCH"
else
  git -C "$MAIN_ROOT" worktree add -b "$BRANCH" "$DIR" "$BASE"
fi

# Run this checkout's setup inside the new worktree; its branch may not contain the scripts yet.
cd "$DIR"
"$SCRIPTS/setup.sh"
echo "WORKTREE_DIR=$DIR"
