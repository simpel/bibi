#!/usr/bin/env bash
# Shared helpers for land.sh and park.sh (sourced, not run).
# Board ids arrive as environment variables from the workflow so they live in one place (work-backlog.js):
# ITEM_ID, PROJECT_ID, STATUS_FIELD and the option id for the target status. Missing ITEM_ID skips the card move.

MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
CO_AUTHOR="${CO_AUTHOR:-Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>}"

# The ticket worktree for issue $1.
ticket_dir() { echo "$(dirname "$MAIN")/okazi-worktrees/t-$1"; }

# One JSON line on stdout. emit state key=value ...  (values are strings; use emit_raw for json)
emit() {
  local state="$1"
  shift
  local args=(--arg state "$state") expr='{state:$state'
  local kv
  for kv in "$@"; do
    args+=(--arg "${kv%%=*}" "${kv#*=}")
    expr+=",${kv%%=*}:\$${kv%%=*}"
  done
  jq -nc "${args[@]}" "$expr}"
}

# Move the issue's card: move_card <option id>. Best effort, never fails the caller.
move_card() {
  [ -n "${ITEM_ID:-}" ] || return 0
  gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD" \
    --single-select-option-id "$1" >/dev/null 2>&1 || true
}

# True while a rebase is stopped in the worktree $PWD.
rebase_in_progress() {
  [ -d "$(git rev-parse --git-path rebase-merge)" ] || [ -d "$(git rev-parse --git-path rebase-apply)" ]
}

conflicted_files() { git diff --name-only --diff-filter=U | paste -sd, -; }
