#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."

source ./.superset/lib.sh

# Never drop the main checkout's database. Containers stay up for the other worktrees.
if ! is_main_checkout && docker info >/dev/null 2>&1; then
  psql_admin -c "DROP DATABASE IF EXISTS \"$(db_name)\" WITH (FORCE)" || true
fi
