#!/usr/bin/env bash
# Drop the database of the worktree in the current directory. Never touches the main checkout.
set -uo pipefail
source "$(dirname "$0")/lib.sh"

# Containers stay up for the other worktrees.
if ! is_main_checkout && docker info >/dev/null 2>&1; then
  psql_admin -c "DROP DATABASE IF EXISTS \"$(db_name)\" WITH (FORCE)" || true
fi
