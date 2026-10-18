#!/usr/bin/env bash
# Lands a ticket on main for the work-backlog workflow. Run from the main checkout:
#   tools/backlog/land.sh <N> --title "<issue title>"   (commit summary on stdin)
#   tools/backlog/land.sh <N> --resume                  (after a conflict was resolved or red checks were fixed)
# Commits, rebases on origin/main, re-runs the checks only when the rebase had something to rebase onto (a no-op
# rebase leaves exactly the tree the implementer verified), pushes (retrying when main moved), moves the card to
# Done and removes the worktree. Prints one JSON line:
#   {"state":"landed","sha"}  {"state":"conflict","files"}  {"state":"red","checks":<checks.sh json>}  {"state":"failed","reason"}
# conflict and red leave the worktree as it is for a model to fix, then --resume. Exit code is always 0.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

N="${1:-}"
MODE="${2:-}"
TITLE="${3:-}"
if ! [[ "$N" =~ ^[0-9]+$ ]] || { [ "$MODE" != "--title" ] && [ "$MODE" != "--resume" ]; }; then
  emit failed "reason=usage: land.sh <N> --title <title> | --resume"
  exit 0
fi
DIR="$(ticket_dir "$N")"
cd "$DIR" 2>/dev/null || { emit failed "reason=no worktree at $DIR"; exit 0; }

commit_work() {
  [ -n "$(git status --porcelain)" ] || return 0
  git add -A
  if [ "$MODE" = "--resume" ]; then
    git commit --amend --no-edit --quiet
  else
    { printf '%s\n\nCloses #%s\n\n' "$TITLE" "$N"; cat; printf '\n%s\n' "$CO_AUTHOR"; } | git commit --quiet -F -
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

if [ "$MODE" = "--resume" ]; then
  continue_rebase || exit 0
  NEED_CHECKS=1
else
  NEED_CHECKS=0
fi
commit_work

for _attempt in 1 2 3; do
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
    CHECKS="$(tools/backlog/checks.sh | tail -1)"
    if [ "$(jq -r .green <<<"$CHECKS")" != true ]; then
      jq -nc --argjson checks "$CHECKS" '{state:"red",checks:$checks}'
      exit 0
    fi
    NEED_CHECKS=0
  fi
  if git push origin HEAD:main >/dev/null 2>&1; then
    SHA="$(git rev-parse HEAD)"
    move_card "${DONE_OPTION:-}"
    cd "$MAIN" || true
    pnpm wt:rm "t-$N" --delete-branch >/dev/null 2>&1 || true
    "$HERE/release.sh" "$N" >/dev/null 2>&1 || true
    emit landed "sha=$SHA"
    exit 0
  fi
done
emit failed "reason=push rejected 3 times because origin/main kept moving"
