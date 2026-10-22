#!/usr/bin/env bash
# Shared helpers for the worktree scripts. Source this file; do not run it.
#
# One shared Postgres + Mailpit (compose project "bibi") serves every worktree. Each worktree
# gets its own database, its own ports and its own `.env`, so migrations, tests and dev servers
# never collide. The main checkout keeps the defaults (database "bibi", ports 3000/3001).
#
# ROOT is the checkout the current directory belongs to, so the scripts can set up a worktree
# whose branch does not contain them yet.

ROOT="$(git rev-parse --show-toplevel)"
MAIN_ROOT="$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
WORKTREES_DIR="$(dirname "$MAIN_ROOT")/bibi-worktrees"
COMPOSE_PROJECT="bibi"

is_main_checkout() { [ "$ROOT" = "$MAIN_ROOT" ]; }

compose() { docker compose -p "$COMPOSE_PROJECT" -f "$MAIN_ROOT/docker-compose.yml" "$@"; }

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Start Docker Desktop and try again." >&2
    exit 1
  fi
}

# Worktree name reduced to a safe Postgres identifier suffix.
worktree_slug() {
  basename "$ROOT" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '_' | cut -c1-40
}

db_name() {
  if is_main_checkout; then echo "bibi"; else echo "bibi_$(worktree_slug)"; fi
}

# Read KEY from a .env file (empty if missing).
env_value() { { grep -E "^$1=" "$2" 2>/dev/null || true; } | tail -1 | cut -d= -f2-; }

# Port offset 1-99. Reuses this worktree's slot, else takes the first one no other worktree holds.
worktree_slot() {
  local own used wt slot
  own="$(env_value WORKTREE_SLOT "$ROOT/.env")"
  if [ -n "$own" ]; then echo "$own"; return; fi
  used=" "
  while read -r wt; do
    [ "$wt" = "$ROOT" ] && continue
    used="$used$(env_value WORKTREE_SLOT "$wt/.env") "
  done < <(git -C "$MAIN_ROOT" worktree list --porcelain | awk '/^worktree /{print $2}')
  for slot in $(seq 1 99); do
    case "$used" in *" $slot "*) ;; *) echo "$slot"; return ;; esac
  done
  echo "No free worktree slot (1-99)." >&2
  exit 1
}

# Replace or append KEY=VALUE in $ROOT/.env.
set_env() {
  local key="$1" value="$2"
  touch "$ROOT/.env"
  { grep -v "^${key}=" "$ROOT/.env" || true; } > "$ROOT/.env.tmp"
  echo "${key}=${value}" >> "$ROOT/.env.tmp"
  mv "$ROOT/.env.tmp" "$ROOT/.env"
}

# Export every KEY=VALUE line of $ROOT/.env. Not `source`: values such as `Bibi <a@b>` break bash.
load_env() {
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in '' | '#'*) continue ;; esac
    export "${line%%=*}=${line#*=}"
  done < "$ROOT/.env"
}

psql_admin() { compose exec -T postgres psql -U bibi -d postgres -v ON_ERROR_STOP=1 "$@"; }
