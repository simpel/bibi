#!/usr/bin/env bash
# Releases the per-ticket lock taken by prep.sh: tools/backlog/release.sh <issue-number>
# Called by park.sh once the worktree is gone. Safe to run when no lock exists.
set -uo pipefail
N="${1:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]]; then
  echo "usage: tools/backlog/release.sh <issue-number>"
  exit 1
fi
MAIN="$(git rev-parse --show-toplevel)"
rmdir "$(dirname "$MAIN")/bibi-worktrees/.locks/t-$N" 2>/dev/null || true
