#!/usr/bin/env bash
# Superset lifecycle hook. The logic lives in tools/worktree/ so it works without Superset.
cd "$(dirname "$0")/.."
exec ./tools/worktree/setup.sh "$@"
