#!/usr/bin/env bash
# Runs backup.sh once a day at BACKUP_HOUR_UTC (default 02) and keeps running after failures.
set -u
hour="${BACKUP_HOUR_UTC:-02}"
while true; do
  now=$(date -u +%s)
  next=$(date -u -d "today ${hour}:30" +%s)
  [ "$next" -le "$now" ] && next=$(date -u -d "tomorrow ${hour}:30" +%s)
  sleep $((next - now))
  backup.sh || echo "backup.failed" >&2
done
