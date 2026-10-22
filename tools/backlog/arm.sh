#!/usr/bin/env bash
# Arms GitHub auto-merge on a ticket's pull request for the work-backlog workflow, after ci.sh reported green. The run
# never merges itself: main only moves through a pull request that GitHub merges once the required checks are green.
# Run from the main checkout:
#   tools/backlog/arm.sh <N> --title "<issue title>" [--resume]   (squash message body on stdin)
# If the PR conflicts with main, the branch is rebased, the checks re-run and it is force-pushed with a lease first
# (--resume continues after a conflict was resolved or red checks were fixed). Then auto-merge is enabled with the squash
# commit "<type>: <issue title> (#<pr>)" and "Closes #N", and the worktree and lock are removed.
# Env: KIND, CHECKS_ARGS, CO_AUTHOR and the board ids (lib.sh).
# Prints one JSON line: {"state":"armed","pr"}  {"state":"conflict","files"}  {"state":"red","checks"}  {"state":"failed","reason"}
# Exit code is always 0.
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
  emit failed "reason=usage: arm.sh <N> --title <title> [--resume]"
  exit 0
fi
SUMMARY="$(cat)"
DIR="$(ticket_dir "$N")"
cd "$DIR" 2>/dev/null || { emit failed "reason=no worktree at $DIR"; exit 0; }
PR="$(pr_number_for "$N")"
[ -n "$PR" ] || { emit failed "reason=no open pull request for ticket/$N"; exit 0; }

NEED_PUSH=0
if [ "$RESUME" = 1 ] && rebase_in_progress; then
  if [ -n "$(conflicted_files)" ] || ! GIT_EDITOR=true git rebase --continue >/dev/null 2>&1; then
    emit conflict "files=$(conflicted_files)"
    exit 0
  fi
  NEED_PUSH=1
fi
# A fix after red checks leaves uncommitted changes: fold them into the ticket's single commit.
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit --amend --no-edit --quiet
  NEED_PUSH=1
fi

# Only a conflict with main needs a rebase: GitHub merges a branch that is behind main without conflicts.
if [ "$(gh pr view "$PR" -R "$REPO" --json mergeable -q .mergeable 2>/dev/null)" = CONFLICTING ]; then
  git fetch origin --quiet || { emit failed "reason=git fetch failed"; exit 0; }
  if ! git rebase origin/main >/dev/null 2>&1; then
    git diff --quiet --diff-filter=U || { emit conflict "files=$(conflicted_files)"; exit 0; }
    git rebase --abort >/dev/null 2>&1
    emit failed "reason=rebase failed without conflicts"
    exit 0
  fi
  NEED_PUSH=1
fi
if [ "$NEED_PUSH" = 1 ]; then
  CHECKS="$(run_checks)"
  if [ "$(jq -r .green <<<"$CHECKS")" != true ]; then
    jq -nc --argjson checks "$CHECKS" '{state:"red",checks:$checks}'
    exit 0
  fi
  git push --force-with-lease origin "HEAD:refs/heads/ticket/$N" >/dev/null 2>&1 || { emit failed "reason=push of ticket/$N rejected"; exit 0; }
fi

SUBJECT="$(commit_type): $TITLE (#$PR)"
BODY="$(printf '%s\n\nCloses #%s\n\n%s\n' "$SUMMARY" "$N" "$CO_AUTHOR")"
gh pr merge "$PR" -R "$REPO" --auto --squash --delete-branch --subject "$SUBJECT" --body "$BODY" >/dev/null 2>&1 \
  || { emit failed "reason=gh pr merge --auto failed (is auto-merge enabled and main protected?)"; exit 0; }
cleanup_ticket "$N"
jq -nc --arg pr "$PR" '{state:"armed",pr:($pr|tonumber)}'
