#!/usr/bin/env bash
# Shared helpers for ship.sh, ci.sh, merge.sh and park.sh (sourced, not run).
# Board ids arrive as environment variables from the workflow so they live in one place (work-backlog.js):
# ITEM_ID, PROJECT_ID, STATUS_FIELD and the option id for the target status. Missing ITEM_ID skips the card move.

MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
CO_AUTHOR="${CO_AUTHOR:-Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>}"

# The ticket worktree for issue $1.
ticket_dir() { echo "$(dirname "$MAIN")/bibi-worktrees/t-$1"; }

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

REPO="${REPO:-simpel/bibi}"

# Conventional Commits type from the ticket's Kind (ADR 0060); release-please reads it on main, and
# .github/workflows/pr-title.yml checks the PR title, which becomes the squash commit.
commit_type() {
  case "$(printf '%s' "${KIND:-}" | tr '[:upper:]' '[:lower:]')" in
    bugfix) echo fix ;;
    codemod|"tech debt") echo refactor ;;
    docs) echo docs ;;
    test) echo test ;;
    *) echo feat ;;
  esac
}

# The open pull request of ticket $1 (empty when there is none).
pr_number_for() {
  gh pr list -R "$REPO" --head "ticket/$1" --state open --json number -q '.[0].number // empty' 2>/dev/null
}

# Run the checks in the current worktree. CHECKS_ARGS=--light runs only lint and check:structure.
# The script comes from the main checkout so a worktree on an older base still gets the current checks.
run_checks() {
  # shellcheck disable=SC2086
  "$MAIN/tools/backlog/checks.sh" ${CHECKS_ARGS:-} | tail -1
}

# Remove the worktree and branch of ticket $1 and release its lock. Best effort.
cleanup_ticket() {
  cd "$MAIN" || true
  pnpm wt:rm "t-$1" --delete-branch >/dev/null 2>&1 || true
  "$(dirname "${BASH_SOURCE[0]}")/release.sh" "$1" >/dev/null 2>&1 || true
}
