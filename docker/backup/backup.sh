#!/usr/bin/env bash
# One backup run: pg_dump (custom format) -> S3-compatible storage, then prune by retention.
# Env: PGHOST PGUSER PGPASSWORD PGDATABASE, BACKUP_S3_BUCKET, BACKUP_S3_ENDPOINT (optional),
#      BACKUP_PREFIX (default okazi/db), BACKUP_RETENTION_DAYS (default 30),
#      BACKUP_LOCAL_DIR (if set, write there instead of uploading; used by the restore test).
set -euo pipefail

prefix="${BACKUP_PREFIX:-okazi/db}"
retention="${BACKUP_RETENTION_DAYS:-30}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="okazi-${stamp}.dump"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

pg_dump --format=custom --no-owner --file="$tmp/$file"
pg_restore --list "$tmp/$file" >/dev/null # fail early on a corrupt dump

if [ -n "${BACKUP_LOCAL_DIR:-}" ]; then
  mkdir -p "$BACKUP_LOCAL_DIR"
  cp "$tmp/$file" "$BACKUP_LOCAL_DIR/$file"
  echo "backup.done file=$file target=local"
  exit 0
fi

s3() { aws ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"} s3 "$@"; }
s3 cp "$tmp/$file" "s3://${BACKUP_S3_BUCKET:?set BACKUP_S3_BUCKET}/$prefix/$file" --only-show-errors
echo "backup.done file=$file target=s3"

cutoff="$(date -u -d "-${retention} days" +%Y%m%d 2>/dev/null || true)"
[ -n "$cutoff" ] || exit 0
s3 ls "s3://$BACKUP_S3_BUCKET/$prefix/" | awk '{print $4}' | while read -r name; do
  day="${name#okazi-}"; day="${day%%T*}"
  if [[ "$day" =~ ^[0-9]{8}$ ]] && [ "$day" -lt "$cutoff" ]; then
    s3 rm "s3://$BACKUP_S3_BUCKET/$prefix/$name" --only-show-errors
    echo "backup.pruned file=$name"
  fi
done
