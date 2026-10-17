#!/usr/bin/env bash
# Runs backup.sh once a day at BACKUP_HOUR_UTC (default 02) and keeps running after failures.
# Optional alerting (healthchecks.io style): BACKUP_HEARTBEAT_URL is pinged after each successful
# backup, BACKUP_FAILURE_URL after a failed one. Ping failures never stop the loop.
set -u
hour="${BACKUP_HOUR_UTC:-02}"

ping_url() {
  [ -n "${1:-}" ] || return 0
  curl -fsS -m 10 --retry 3 -o /dev/null "$1" || echo "backup.ping_failed" >&2
}

run_once() {
  if backup.sh; then
    ping_url "${BACKUP_HEARTBEAT_URL:-}"
  else
    echo "backup.failed" >&2
    ping_url "${BACKUP_FAILURE_URL:-}"
  fi
}

while true; do
  now=$(date -u +%s)
  next=$(date -u -d "today ${hour}:30" +%s)
  [ "$next" -le "$now" ] && next=$(date -u -d "tomorrow ${hour}:30" +%s)
  sleep $((next - now))
  run_once
done
