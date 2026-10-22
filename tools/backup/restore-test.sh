#!/usr/bin/env bash
# Restore test (ADR 0013): restore a dump into a throwaway pgvector container and verify it.
# Usage: tools/backup/restore-test.sh <dump-file>
#        tools/backup/restore-test.sh --latest   (downloads the newest dump; needs BACKUP_S3_BUCKET,
#                                                 BACKUP_S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
# Exit code 0 = restore succeeded and verification passed.
set -euo pipefail

work="$(mktemp -d)"
name="bibi-restore-test-$$"
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

arg="${1:?usage: restore-test.sh <dump-file>|--latest}"
if [ "$arg" = "--latest" ]; then
  prefix="${BACKUP_PREFIX:-bibi/db}"
  s3() { aws ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"} s3 "$@"; }
  latest="$(s3 ls "s3://${BACKUP_S3_BUCKET:?set BACKUP_S3_BUCKET}/$prefix/" | awk '{print $4}' | sort | tail -1)"
  [ -n "$latest" ] || { echo "restore-test.failed no dumps found" >&2; exit 1; }
  s3 cp "s3://$BACKUP_S3_BUCKET/$prefix/$latest" "$work/dump" --only-show-errors
  echo "restore-test.source $latest"
else
  cp "$arg" "$work/dump"
  echo "restore-test.source $arg"
fi

docker run -d --name "$name" -e POSTGRES_PASSWORD=restore -e POSTGRES_USER=bibi \
  -e POSTGRES_DB=bibi pgvector/pgvector:pg17 >/dev/null
for _ in $(seq 1 60); do
  docker exec "$name" pg_isready -U bibi -d bibi >/dev/null 2>&1 && break
  sleep 1
done
sleep 2 # the entrypoint restarts postgres once after init

docker cp "$work/dump" "$name:/tmp/dump"
docker exec "$name" pg_restore -U bibi -d bibi --no-owner --exit-on-error /tmp/dump

psql() { docker exec "$name" psql -U bibi -d bibi -tA -c "$1"; }
migrations="$(psql 'select count(*) from _prisma_migrations where finished_at is not null')"
tables="$(psql "select count(*) from information_schema.tables where table_schema='public'")"
ext="$(psql "select count(*) from pg_extension where extname='vector'")"
echo "restore-test.verify migrations=$migrations tables=$tables vector=$ext"
[ "$migrations" -gt 0 ] && [ "$tables" -gt 1 ] && [ "$ext" -eq 1 ] \
  || { echo "restore-test.failed verification" >&2; exit 1; }
echo "restore-test.ok"
