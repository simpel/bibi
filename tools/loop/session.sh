#!/usr/bin/env bash
# One ticket in one headless Claude session: tools/loop/session.sh <slot> <ticket.json>. Run from the main checkout.
# The session implements and runs verify.sh until green in a single context. The script then verifies on its own,
# runs the tenancy review when needed, and resumes the same session once for red checks or review findings.
# Prints one JSON line: {"state":"green|red|blocked|rate_limited|failed","reason","summaryFile","costUsd",...}.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
. "$HERE/config.sh"
SLOT="$1"
TICKET="$(cat "$2")"
N="$(jq -r .number <<<"$TICKET")"
PROFILE="$(node "$HERE/model.mjs" "$TICKET")"
pf() { jq -r ".$1" <<<"$PROFILE"; }
RUN="$LOOP_DIR/runs/$N-$(date +%Y%m%d%H%M%S)"
mkdir -p "$RUN"
cd "$(slot_dir "$SLOT")" || { emit failed "reason=no slot worktree"; exit 0; }

finish() {
  jq -nc --arg state "$1" --arg reason "${2:-}" --arg summary "$RUN/summary.txt" --argjson cost "$(session_cost "$RUN"/*.json)" \
    --argjson profile "$PROFILE" '{state:$state,reason:$reason,summaryFile:$summary} + $cost + {model:$profile.model}'
  exit 0
}

prompt() {
  gh issue view "$N" -R "$REPO" --json title,body --jq '"# #'"$N"' \(.title)\n\n\(.body)"'
  cat <<TEXT

You work on this issue in the current worktree: branch ticket/$N, fresh from origin/main, with its own databases.
1. Read .claude/skills/$(pf skill)/SKILL.md and follow it. Open other skills it names only when you need them.
2. Stay in scope. Mention out-of-scope problems in your final message instead of fixing them.
   Change files with the Edit and Write tools, not shell redirects. Run one command per Bash call; never cd.
3. Run $HERE/verify.sh until it prints GREEN. Never commit, push or call gh: the loop ships your change.
4. If the issue cannot be done (unclear, blocked, needs a human decision), stop and start your final message with
   BLOCKED: <reason>.
5. Your final message is the pull request summary: 3 to 8 lines on what changed and why.
TEXT
}

# Resume the implementing session with a reason to fix something: fix_round <name> <text>.
fix_round() {
  run_claude "$RUN/$1.json" "$(pf model)" "$(pf effort)" "$(pf budgetUsd)" --resume "$SID" <<<"$2

Fix this, run $HERE/verify.sh until GREEN, then give the pull request summary again as your final message."
  jq -r '.result // empty' "$RUN/$1.json" >"$RUN/summary.txt.new" && [ -s "$RUN/summary.txt.new" ] \
    && mv "$RUN/summary.txt.new" "$RUN/summary.txt"
}

prompt | run_claude "$RUN/impl.json" "$(pf model)" "$(pf effort)" "$(pf budgetUsd)"
rate_limited "$RUN/impl.json" && finish rate_limited "rate or usage limit"
SID="$(jq -r '.session_id // empty' "$RUN/impl.json" 2>/dev/null)"
[ -n "$SID" ] || finish failed "the session gave no result: $(head -c 300 "$RUN/impl.json.err")"
jq -r '.result // empty' "$RUN/impl.json" >"$RUN/summary.txt"
grep -q '^BLOCKED:' "$RUN/summary.txt" && finish blocked "$(head -5 "$RUN/summary.txt")"
[ "$(jq -r .subtype "$RUN/impl.json")" = success ] || finish red "session ended with $(jq -r .subtype "$RUN/impl.json")"

VERIFY="$("$HERE/verify.sh")" || { fix_round fix "verify.sh is still red:
$VERIFY"; VERIFY="$("$HERE/verify.sh")" || finish red "$VERIFY"; }
FINDINGS="$("$HERE/review.sh" "$SLOT" "$RUN/review.json")"
case "$FINDINGS" in
  OK* | SKIPPED) ;;
  *) fix_round review "The tenancy review found:
$FINDINGS"
     VERIFY="$("$HERE/verify.sh")" || finish red "$VERIFY" ;;
esac
finish green
