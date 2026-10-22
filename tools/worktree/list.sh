#!/usr/bin/env bash
# List worktrees with their branch, database and web/MCP/Storybook ports: pnpm wt:list
set -euo pipefail
source "$(dirname "$0")/lib.sh"

printf '%-50s %-28s %-28s %s\n' PATH BRANCH DATABASE PORTS
git -C "$MAIN_ROOT" worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
  branch="$(git -C "$wt" branch --show-current 2>/dev/null || true)"
  db="$(env_value DATABASE_URL "$wt/.env")"
  web="$(env_value WEB_PORT "$wt/.env")"
  mcp="$(env_value PORT "$wt/.env")"
  sb="$(env_value STORYBOOK_PORT "$wt/.env")"
  printf '%-50s %-28s %-28s %s\n' "$wt" "${branch:-detached}" "${db##*/}" "${web:-3330}/${mcp:-3331}/${sb:-3332}"
done
