#!/usr/bin/env bash
# Ships a ticket as a pull request for the ticket loop. Run from the main checkout:
#   tools/backlog/ship.sh <N> --title "<issue title>" [--resume]   (PR summary on stdin)
# One commit per ticket, titled "<type>: <issue title>" (type from KIND, see lib.sh) with "Closes #N". Commits,
# rebases on origin/main, re-runs the checks only when the rebase had something to rebase onto (a no-op rebase leaves
# exactly the tree the implementer verified), pushes ticket/<N> with a lease and opens the pull request (or finds the
# open one). --resume continues after a conflict was resolved or red checks or CI were fixed: it amends the commit.
# REVIEW_ONLY=1 (decision tickets): after the PR is open the worktree is removed and the lock released, and the run
# never merges it. Env: KIND, CHECKS_ARGS (--light), CO_AUTHOR, ITEM_ID and the board ids (lib.sh).
# Prints one JSON line:
#   {"state":"opened","pr","url"}  {"state":"conflict","files"}  {"state":"red","checks":<checks.sh json>}  {"state":"failed","reason"}
# conflict and red leave the worktree as it is for a model to fix, then --resume. Exit code is always 0.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

N="${1:-}"
TITLE=""
RESUME=0
[ "${2:-}" = "--title" ] && TITLE="${3:-}"
[ "${4:-}" = "--resume" ] && RESUME=1
if ! [[ "$N" =~ ^[0-9]+$ ]] || [ -z "$TITLE" ]; then
  emit failed "reason=usage: ship.sh <N> --title <title> [--resume]"
  exit 0
fi
SUMMARY="$(cat)"
DIR="$(ticket_dir "$N")"
cd "$DIR" 2>/dev/null || { emit failed "reason=no worktree at $DIR"; exit 0; }

commit_work() {
  [ -n "$(git status --porcelain)" ] || return 0
  git add -A
  if [ "$RESUME" = 1 ] && [ -n "$(git log origin/main..HEAD --oneline)" ]; then
    git commit --amend --no-edit --quiet
  else
    { printf '%s: %s\n\nCloses #%s\n\n%s\n\n%s\n' "$(commit_type)" "$TITLE" "$N" "$SUMMARY" "$CO_AUTHOR"; } | git commit --quiet -F -
  fi
}

# Continue a rebase the model finished resolving. Prints conflict JSON and returns 1 if files are still unmerged.
continue_rebase() {
  rebase_in_progress || return 0
  if [ -n "$(conflicted_files)" ]; then
    emit conflict "files=$(conflicted_files)"
    return 1
  fi
  GIT_EDITOR=true git rebase --continue >/dev/null 2>&1 || {
    emit conflict "files=$(conflicted_files)"
    return 1
  }
}

NEED_CHECKS=0
if [ "$RESUME" = 1 ]; then
  continue_rebase || exit 0
  NEED_CHECKS=1
fi
commit_work

git fetch origin --quiet || { emit failed "reason=git fetch failed"; exit 0; }
if [ "$(git merge-base HEAD origin/main)" != "$(git rev-parse origin/main)" ]; then
  NEED_CHECKS=1
  if ! git rebase origin/main >/dev/null 2>&1; then
    git diff --quiet --diff-filter=U || { emit conflict "files=$(conflicted_files)"; exit 0; }
    git rebase --abort >/dev/null 2>&1
    emit failed "reason=rebase failed without conflicts"
    exit 0
  fi
fi
if [ "$NEED_CHECKS" = 1 ]; then
  CHECKS="$(run_checks)"
  if [ "$(jq -r .green <<<"$CHECKS")" != true ]; then
    jq -nc --argjson checks "$CHECKS" '{state:"red",checks:$checks}'
    exit 0
  fi
fi

git fetch origin "ticket/$N" --quiet 2>/dev/null || true
git push --force-with-lease origin "HEAD:refs/heads/ticket/$N" >/dev/null 2>&1 || { emit failed "reason=push of ticket/$N rejected"; exit 0; }

PR="$(pr_number_for "$N")"
if [ -z "$PR" ]; then
  BODY="$(printf '%s\n\nCloses #%s\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n' "$SUMMARY" "$N")"
  gh pr create -R "$REPO" --base main --head "ticket/$N" --title "$(commit_type): $TITLE" --body "$BODY" >/dev/null 2>&1 \
    || { emit failed "reason=gh pr create failed"; exit 0; }
  PR="$(pr_number_for "$N")"
fi
[ -n "$PR" ] || { emit failed "reason=no open pull request for ticket/$N"; exit 0; }
URL="https://github.com/$REPO/pull/$PR"

if [ "${REVIEW_ONLY:-}" = 1 ]; then
  cleanup_ticket "$N"
fi
jq -nc --arg pr "$PR" --arg url "$URL" '{state:"opened",pr:($pr|tonumber),url:$url}'
