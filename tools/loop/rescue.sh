#!/usr/bin/env bash
# Rescues the first open loop PR that conflicts with main: tools/loop/rescue.sh <slot>. Run from the main checkout.
# Hand merges move main, so a waiting PR can start to conflict. The slot claims the ticket, continues its branch,
# rebases it on origin/main and, only when the rebase stops, runs one session to resolve it. ship.sh --resume then
# re-runs the checks and force-pushes the branch with a lease. A rescue that fails parks the ticket. Prints nothing.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
. "$HERE/config.sh"
SLOT="$1"
CLAIMS="$LOOP_DIR/claims"

PR="$(gh pr list -R "$REPO" --state open -L 100 --json number,headRefName,mergeable,title \
  --jq '[.[] | select((.headRefName | test("^ticket/[0-9]+$")) and .mergeable == "CONFLICTING")][0] // empty')"
[ -n "$PR" ] || exit 0
N="$(jq -r '.headRefName | split("/")[1]' <<<"$PR")"
mkdir -p "$CLAIMS"
mkdir "$CLAIMS/$N" 2>/dev/null || exit 0
printf '{"slot":%s,"labels":[],"at":"%s"}' "$SLOT" "$(date -u +%FT%TZ)" >"$CLAIMS/$N/claim.json"
trap 'rm -rf "${CLAIMS:?}/$N"' EXIT
log "rescuing PR #$(jq -r .number <<<"$PR") (ticket #$N), it conflicts with main"

PREP="$(BASE_REF="origin/ticket/$N" "$HERE/prep-slot.sh" "$SLOT" "$N")"
[ "$(jq -r .state <<<"$PREP")" = ready ] || { log "rescue setup failed: $(jq -r .reason <<<"$PREP")"; exit 0; }
DIR="$(slot_dir "$SLOT")"
TITLE="$(gh issue view "$N" -R "$REPO" --json title --jq .title)"
export TICKET_DIR="$DIR" KEEP_WORKTREE=1 KIND CO_AUTHOR="Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
KIND="$(gh issue view "$N" -R "$REPO" --json labels --jq '[.labels[].name] | if index("type:docs") then "Docs" else "" end')"

if ! git -C "$DIR" rebase origin/main >/dev/null 2>&1; then
  OUT="$LOOP_DIR/runs/rescue-$N-$(date +%Y%m%d%H%M%S).json"
  mkdir -p "$(dirname "$OUT")"
  (cd "$DIR" && run_claude "$OUT" sonnet medium 4 <<PROMPT)
A rebase of branch ticket/$N onto origin/main stopped on conflicts. Resolve every conflicted file, keeping the
intent of both sides, and stage it with git add. Never run git rebase --continue, commit or push.
If a migration under packages/db/prisma/migrations conflicts or now sorts before a migration from main, move this
branch's migration to a new timestamp so it applies last. Run $HERE/verify.sh until GREEN.
PROMPT
fi
RESULT="$(printf 'Rebased on main after a conflict.\n' | "$MAIN/tools/backlog/ship.sh" "$N" --title "$TITLE" --resume)"
if [ "$(jq -r .state <<<"$RESULT")" != opened ]; then
  printf 'Rescue after a conflict with main failed: %s\n' "$RESULT" | "$MAIN/tools/backlog/park.sh" "$N" "$TITLE" >/dev/null
  log "rescue of #$N failed, parked"
fi
