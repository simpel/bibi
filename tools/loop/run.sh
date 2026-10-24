#!/usr/bin/env bash
# The ticket loop for one slot: tools/loop/run.sh --slot <k> [--once] [--dry-run]. Run from the main checkout,
# in its own terminal tab (caffeinate -i keeps the Mac awake). Run a second tab with --slot 2 for parallel work.
# Each round: stop while main is red, rescue an open loop PR that conflicts with main, pick and claim the best ready
# ticket, reset the slot, run one session, then open the PR or park the ticket. It never merges.
# --dry-run prints the pick and the profile and changes nothing. --once stops after one ticket.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=config.sh
. "$HERE/config.sh"
SLOT=""; ONCE=0; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --slot) SLOT="$2"; shift 2 ;;
    --once) ONCE=1; shift ;;
    --dry-run) DRY=1; shift ;;
    *) echo "usage: run.sh --slot <k> [--once] [--dry-run]" >&2; exit 1 ;;
  esac
done
[[ "$SLOT" =~ ^[0-9]+$ ]] || { echo "usage: run.sh --slot <k> [--once] [--dry-run]" >&2; exit 1; }
cd "$MAIN" || exit 1
CLAIMS="$LOOP_DIR/claims"
PARKED_ROW=0

release() { rm -rf "${CLAIMS:?}/$1"; }
# Claims this slot left behind when it was stopped mid-ticket.
for c in "$CLAIMS"/*/claim.json; do
  [ -f "$c" ] && [ "$(jq -r .slot "$c")" = "$SLOT" ] && rm -rf "$(dirname "$c")"
done

co_author() {
  case "$1" in haiku) echo "Claude Haiku 5.5" ;; opus) echo "Claude Opus 5.5" ;; *) echo "Claude Sonnet 5.5" ;; esac
}

# ship_or_park <ticket json> <session json>: prints opened, parked or the ship failure.
ship_or_park() {
  local t="$1" s="$2" n title state reason
  n="$(jq -r .number <<<"$t")"; title="$(jq -r .title <<<"$t")"; state="$(jq -r .state <<<"$s")"
  export TICKET_DIR KIND ITEM_ID CO_AUTHOR KEEP_WORKTREE=1
  TICKET_DIR="$(slot_dir "$SLOT")"; KIND="$(jq -r .kind <<<"$t")"; ITEM_ID="$(jq -r .itemId <<<"$t")"
  CO_AUTHOR="Co-Authored-By: $(co_author "$(jq -r .model <<<"$s")") <noreply@anthropic.com>"
  if [ "$state" = green ]; then
    reason="$("$MAIN/tools/backlog/ship.sh" "$n" --title "$title" <"$(jq -r .summaryFile <<<"$s")")"
    [ "$(jq -r .state <<<"$reason")" = opened ] && { echo opened; return; }
  else
    reason="$(jq -r .reason <<<"$s")"
  fi
  printf '%s\n' "$reason" | "$MAIN/tools/backlog/park.sh" "$n" "$title" >/dev/null
  echo parked
}

record() {
  jq -c --arg outcome "$3" '{tickets: [{number, size, kind, outcome: $outcome} + ($s | {model, costUsd, inputTokens, cacheReadTokens})]}' \
    --argjson s "$2" <<<"$1" | node "$MAIN/tools/backlog/metrics.mjs" record --path loop --since "$4" >/dev/null
}

one_ticket() {
  local pick t n s outcome since
  local flags=(--slot "$SLOT")
  [ "$DRY" = 1 ] && flags+=(--dry-run)
  pick="$(node "$HERE/pick.mjs" "${flags[@]}")"
  t="$(jq -c .ticket <<<"$pick")"
  [ "$t" != null ] || { log "nothing ready: $(jq -c '.problem // .skipped' <<<"$pick")"; return 1; }
  n="$(jq -r .number <<<"$t")"
  if [ "$DRY" = 1 ]; then log "would take #$n $(node "$HERE/model.mjs" "$t")"; return 0; fi
  ITEM_ID="$(jq -r .itemId <<<"$t")" move_card "$IN_PROGRESS_OPTION"
  log "#$n $(jq -r .title <<<"$t")"
  since="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local prep; prep="$("$HERE/prep-slot.sh" "$SLOT" "$n")"
  if [ "$(jq -r .state <<<"$prep")" != ready ]; then
    ITEM_ID="$(jq -r .itemId <<<"$t")" move_card "$TODO_OPTION"; release "$n"
    log "slot setup failed, stopping: $(jq -r .reason <<<"$prep")"; exit 1
  fi
  printf '%s' "$t" >"$LOOP_DIR/slot-$SLOT.ticket.json"
  export CHECKS_ARGS=""
  [[ "$(jq -r .kind <<<"$t")" = Docs || "$(jq -r '.labels | index("type:decision")' <<<"$t")" != null ]] && CHECKS_ARGS=--light
  s="$("$HERE/session.sh" "$SLOT" "$LOOP_DIR/slot-$SLOT.ticket.json")"
  if [ "$(jq -r .state <<<"$s")" = rate_limited ]; then
    ITEM_ID="$(jq -r .itemId <<<"$t")" move_card "$TODO_OPTION"; release "$n"
    log "rate limited, waiting ${RATE_LIMIT_SECONDS}s"; sleep "$RATE_LIMIT_SECONDS"; return 0
  fi
  outcome="$(ship_or_park "$t" "$s")"
  record "$t" "$s" "$outcome" "$since"
  release "$n"
  log "#$n $outcome ($(jq -r '.costUsd // "?"' <<<"$s") USD)"
  [ "$outcome" = opened ] && PARKED_ROW=0 || PARKED_ROW=$((PARKED_ROW + 1))
}

while :; do
  if [ "$(jq -r .state <<<"$("$MAIN/tools/backlog/main-ci.sh" --timeout 0)")" = red ]; then
    log "main is red, waiting"; sleep "$IDLE_SECONDS"; continue
  fi
  [ "$DRY" = 1 ] || "$HERE/rescue.sh" "$SLOT"
  if one_ticket; then
    [ "$PARKED_ROW" -ge "$MAX_PARKED_IN_A_ROW" ] && { log "$PARKED_ROW parked in a row, stopping"; exit 1; }
    [ "$ONCE" = 1 ] || [ "$DRY" = 1 ] && exit 0
  else
    [ "$ONCE" = 1 ] || [ "$DRY" = 1 ] && exit 0
    sleep "$IDLE_SECONDS"
  fi
done
