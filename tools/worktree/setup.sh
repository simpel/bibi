#!/usr/bin/env bash
# Prepare the checkout in the current directory: .env, dependencies, its own database and ports.
# Idempotent. Run from inside the worktree (or the main checkout).
set -euo pipefail
source "$(dirname "$0")/lib.sh"
require_docker
cd "$ROOT"

# Env: copy from the main checkout, else seed from the example.
if [ ! -f .env ]; then
  if ! is_main_checkout && [ -f "$MAIN_ROOT/.env" ]; then
    # The main client id belongs to the main database; drop it so it is provisioned below.
    grep -v '^WEB_OAUTH_CLIENT_ID=' "$MAIN_ROOT/.env" > .env
  elif [ -f .exampleenv ]; then
    # Empty optional keys (BIBI_API_KEY=) fail the Zod env schema; leave them unset instead.
    { grep -vE '^[A-Z_]+=$' .exampleenv || true; } > .env
  fi
fi

# The example ships an empty secret; Better Auth needs at least 32 characters.
if ! grep -qE '^BETTER_AUTH_SECRET=.{32,}' .env; then
  set_env BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
fi

DB="$(db_name)"

# Worktrees get their own database and ports; the main checkout keeps the defaults.
if ! is_main_checkout; then
  SLOT="$(worktree_slot)"
  WEB_PORT=$((3100 + SLOT))
  MCP_PORT=$((3200 + SLOT))
  set_env WORKTREE_SLOT "$SLOT"
  set_env DATABASE_URL "postgresql://bibi:bibi@localhost:5432/$DB"
  set_env WEB_PORT "$WEB_PORT"
  set_env PORT "$MCP_PORT"
  set_env WEB_URL "http://localhost:$WEB_PORT"
  set_env BETTER_AUTH_URL "http://localhost:$WEB_PORT"
  set_env MCP_URL "http://localhost:$MCP_PORT"
fi

pnpm install --frozen-lockfile
pnpm db:generate # the Prisma client is gitignored; web and mcp crash without it

compose up -d --wait postgres mailpit
if ! psql_admin -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB'" | grep -q 1; then
  psql_admin -c "CREATE DATABASE \"$DB\""
fi

load_env
pnpm db:migrate
pnpm --filter @bibi/core seed:skills
if [ -z "$(env_value WEB_OAUTH_CLIENT_ID .env)" ]; then
  CLIENT_LINE="$(pnpm --filter @bibi/web provision:oauth | grep '^WEB_OAUTH_CLIENT_ID=' | tail -1)"
  [ -n "$CLIENT_LINE" ] && set_env WEB_OAUTH_CLIENT_ID "${CLIENT_LINE#WEB_OAUTH_CLIENT_ID=}"
fi

echo "Worktree ready: $ROOT (database $DB)"
