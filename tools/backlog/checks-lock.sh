#!/usr/bin/env bash
# One check run at a time on this machine (sourced by checks.sh, not run). Two worktrees running pnpm test at once on
# the shared Postgres make timing-sensitive tests time out, so loop slots implement in parallel but take turns here.
# The lock is a directory (atomic mkdir) holding the holder's pid; a lock whose holder is dead is taken over.
# Needs MAIN. CHECKS_LOCK_POLL sets the wait between tries in seconds (default 10).

checks_lock_dir() { echo "$(dirname "$MAIN")/bibi-worktrees/.locks/checks"; }

# Wait for the lock, take it and release it when the calling shell exits.
take_checks_lock() {
  local lock pid waited=0
  lock="$(checks_lock_dir)"
  mkdir -p "$(dirname "$lock")"
  until mkdir "$lock" 2>/dev/null; do
    pid="$(cat "$lock/pid" 2>/dev/null)"
    # An empty pid is a holder that has not written it yet: wait. A dead pid is a stale lock: take it over.
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      rm -rf "$lock"
      continue
    fi
    [ "$waited" = 0 ] && echo "checks: waiting for the run of pid ${pid:-?} to finish" >&2
    waited=1
    sleep "${CHECKS_LOCK_POLL:-10}"
  done
  echo "$$" >"$lock/pid"
  trap 'rm -rf "$(checks_lock_dir)"' EXIT
}
