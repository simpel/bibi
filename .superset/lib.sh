#!/usr/bin/env bash
# Shared helpers for the Superset lifecycle scripts. Source this file; do not run it.
#
# One shared Postgres + Mailpit (compose project "okazi") serves every worktree. Each worktree
# gets its own database and its own ports, so migrations and dev servers never collide.
# The main checkout keeps the defaults (database "okazi", ports 3000/3001).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAIN_ROOT="$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
COMPOSE_PROJECT="okazi"

is_main_checkout() { [ "$ROOT" = "$MAIN_ROOT" ]; }

compose() { docker compose -p "$COMPOSE_PROJECT" -f "$MAIN_ROOT/docker-compose.yml" "$@"; }

# Worktree name reduced to a safe Postgres identifier suffix.
worktree_slug() {
  basename "$ROOT" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '_' | cut -c1-40
}

# Stable slot 0-99 per worktree, used as a port offset.
worktree_slot() { echo $(($(basename "$ROOT" | cksum | cut -d' ' -f1) % 100)); }

db_name() {
  if is_main_checkout; then echo "okazi"; else echo "okazi_$(worktree_slug)"; fi
}

# Replace or append KEY=VALUE in $ROOT/.env.
set_env() {
  local key="$1" value="$2"
  touch "$ROOT/.env"
  { grep -v "^${key}=" "$ROOT/.env" || true; } > "$ROOT/.env.tmp"
  echo "${key}=${value}" >> "$ROOT/.env.tmp"
  mv "$ROOT/.env.tmp" "$ROOT/.env"
}

# Export every KEY=VALUE line of $ROOT/.env. Not `source`: values such as `Okazi <a@b>` break bash.
load_env() {
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in '' | '#'*) continue ;; esac
    export "${line%%=*}=${line#*=}"
  done < "$ROOT/.env"
}

psql_admin() { compose exec -T postgres psql -U okazi -d postgres -v ON_ERROR_STOP=1 "$@"; }
