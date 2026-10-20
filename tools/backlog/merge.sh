#!/usr/bin/env bash
# Squash-merges a ticket's pull request for the work-backlog workflow, after ci.sh reported green. Run from the main
# checkout, one ticket at a time:
#   tools/backlog/merge.sh <N> --title "<issue title>" [--resume]   (squash message body on stdin)
# The squash commit is "<type>: <issue title> (#<pr>)" with "Closes #N", one commit on main per ticket. If main moved
# since the PR was opened, the branch is rebased and the checks re-run first (CI already passed on the old base),
# then it is force-pushed with a lease and merged without waiting for CI again. Afterwards the remote branch is
# deleted, the card moves to Done, and the worktree and lock are removed. --resume continues after a conflict was
# resolved or red checks were fixed. Env: KIND, CHECKS_ARGS, CO_AUTHOR, DONE_OPTION and the board ids (lib.sh).
# Prints one JSON line: {"state":"merged","sha","pr"}  {"state":"conflict","files"}  {"state":"red","checks"}  {"state":"failed","reason"}
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
  emit failed "reason=usage: merge.sh <N> --title <title> [--resume]"
  exit 0
fi
SUMMARY="$(cat)"
DIR="$(ticket_dir "$N")"
cd "$DIR" 2>/dev/null || { emit failed "reason=no worktree at $DIR"; exit 0; }
PR="$(pr_number_for "$N")"
[ -n "$PR" ] || { emit failed "reason=no open pull request for ticket/$N"; exit 0; }

if [ "$RESUME" = 1 ] && rebase_in_progress; then
  if [ -n "$(conflicted_files)" ] || ! GIT_EDITOR=true git rebase --continue >/dev/null 2>&1; then
    emit conflict "files=$(conflicted_files)"
    exit 0
  fi
  NEED_CHECKS=1
else
  NEED_CHECKS=0
fi
# A fix after red checks leaves uncommitted changes: fold them into the ticket's single commit.
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit --amend --no-edit --quiet
  NEED_CHECKS=1
fi

SUBJECT="$(commit_type): $TITLE (#$PR)"
BODY="$(printf '%s\n\nCloses #%s\n\n%s\n' "$SUMMARY" "$N" "$CO_AUTHOR")"
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
    CHECKS="$(run_checks)"
    if [ "$(jq -r .green <<<"$CHECKS")" != true ]; then
      jq -nc --argjson checks "$CHECKS" '{state:"red",checks:$checks}'
      exit 0
    fi
    git push --force-with-lease origin "HEAD:refs/heads/ticket/$N" >/dev/null 2>&1 || { emit failed "reason=push of ticket/$N rejected"; exit 0; }
    NEED_CHECKS=0
  fi
  if gh pr merge "$PR" -R "$REPO" --squash --subject "$SUBJECT" --body "$BODY" >/dev/null 2>&1; then
    SHA="$(gh pr view "$PR" -R "$REPO" --json mergeCommit -q '.mergeCommit.oid // empty' 2>/dev/null)"
    git push origin --delete "ticket/$N" >/dev/null 2>&1 || true
    move_card "${DONE_OPTION:-}"
    cleanup_ticket "$N"
    jq -nc --arg sha "$SHA" --arg pr "$PR" '{state:"merged",sha:$sha,pr:($pr|tonumber)}'
    exit 0
  fi
  sleep "${MERGE_RETRY_SECONDS:-5}"
done
emit failed "reason=gh pr merge failed 3 times (conflicts with main or a protected branch)"
