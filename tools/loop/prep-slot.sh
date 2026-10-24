#!/usr/bin/env bash
# Resets a loop slot for a ticket: tools/loop/prep-slot.sh <slot> <issue-number>. Run from the main checkout.
# BASE_REF (default origin/main) is where ticket/<N> starts; rescue.sh passes origin/ticket/<N> to continue an open PR.
# Each slot keeps one worktree (../bibi-worktrees/slot-<k>, created once with pnpm wt:new) and its own databases.
# Per ticket: branch ticket/<N> from origin/main, a clean tree, and both databases dropped and rebuilt from the
# migrations on the branch, so a migration of the slot's previous (unmerged) ticket never lingers.
# Prints one JSON line: {"state":"ready","dir"} or {"state":"failed","reason"}. Setup output goes to <loop>/slot-<k>.prep.log.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
. "$HERE/config.sh"
SLOT="${1:-}"
N="${2:-}"
[[ "$SLOT" =~ ^[0-9]+$ && "$N" =~ ^[0-9]+$ ]] || { emit failed "reason=usage: prep-slot.sh <slot> <N>"; exit 0; }
DIR="$(slot_dir "$SLOT")"
mkdir -p "$LOOP_DIR"
LOG="$LOOP_DIR/slot-$SLOT.prep.log"
: >"$LOG"
fail() { emit failed "reason=$1 (log: $LOG)"; exit 0; }

git -C "$MAIN" fetch origin --prune --quiet || fail "git fetch failed"
if [ ! -d "$DIR" ]; then
  (cd "$MAIN" && pnpm wt:new "slot-$SLOT" --base origin/main --branch "loop/slot-$SLOT") >>"$LOG" 2>&1 \
    || fail "pnpm wt:new failed"
fi

cd "$DIR" || fail "no worktree at $DIR"
rebase_in_progress && git rebase --abort >>"$LOG" 2>&1
git checkout --force -B "ticket/$N" "${BASE_REF:-origin/main}" >>"$LOG" 2>&1 || fail "could not check out ticket/$N"
git clean -fdx -e .env -e node_modules >>"$LOG" 2>&1

# shellcheck source=../worktree/lib.sh
. "$MAIN/tools/worktree/lib.sh"
DB="$(db_name)"
for db in "$DB" "${DB}_test"; do
  psql_admin -c "DROP DATABASE IF EXISTS \"$db\" WITH (FORCE)" >>"$LOG" 2>&1 || fail "could not drop $db"
done
# setup.sh recreates the database, migrates, seeds the skills and provisions a new OAuth client.
{ grep -v '^WEB_OAUTH_CLIENT_ID=' .env >.env.tmp || true; } && mv .env.tmp .env
"$MAIN/tools/worktree/setup.sh" >>"$LOG" 2>&1 || fail "worktree setup failed"
pnpm test:db >>"$LOG" 2>&1 || fail "pnpm test:db failed"
emit ready "dir=$DIR"
