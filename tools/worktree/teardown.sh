#!/usr/bin/env bash
# Drop the databases (dev and `_test`) of the worktree in the current directory. Never touches the
# main checkout.
set -uo pipefail
source "$(dirname "$0")/lib.sh"

# Containers stay up for the other worktrees.
if ! is_main_checkout && docker info >/dev/null 2>&1; then
  for DB in "$(db_name)" "$(db_name)_test"; do
    psql_admin -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" || true
  done
fi
