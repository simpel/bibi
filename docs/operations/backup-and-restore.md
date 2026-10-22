# Database backup and restore

Implements the backup part of [ADR 0013](../decisions/0013-hosting-and-deploy.md).

## What is backed up
| What | How | Where | Retention |
| --- | --- | --- | --- |
| Postgres `bibi` database | `backup` service in `docker-compose.prod.yml`: `pg_dump --format=custom` nightly at 02:30 UTC | Hetzner Object Storage bucket `BACKUP_S3_BUCKET`, prefix `bibi/db/` | `BACKUP_RETENTION_DAYS` (default 30), older dumps are deleted after each run |
| Whole server | Hetzner server backup (enabled in the Hetzner console) | Hetzner | Hetzner's rotation (7 slots) |
| Coolify instance data | Coolify's own backup (see below) | Same bucket, prefix `coolify/` | Same as above |

The dump covers the whole `bibi` database, including the `pgboss` schema (the worker's queue, schedules and job history, ADR 0027). pg-boss lives outside Prisma, so the Prisma migration check does not see it; keep `pg_dump` unfiltered (no `--schema` or `--exclude-schema`). On restore, the worker recreates or migrates the schema on its next start.

Dumps are named `bibi-<UTC timestamp>.dump`. The service writes `backup.done`, `backup.pruned` and `backup.failed` lines to the container log (`docker logs <project>-backup-1`).

## Configuration
Set in Coolify (secrets) or `.env.prod`: `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT` (for example `https://fsn1.your-objectstorage.com`), `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY`, optional `BACKUP_S3_REGION`, `BACKUP_RETENTION_DAYS`, `BACKUP_HOUR_UTC`. Use a bucket-scoped key. Enable bucket versioning or object lock if ransomware protection is wanted.

## Alerting
Without alerting a failed backup is only visible in the container log. Two optional variables make the `backup` service call an uptime monitor (healthchecks.io, Uptime Kuma push monitor or similar):

| Variable | When it is called |
| --- | --- |
| `BACKUP_HEARTBEAT_URL` | After each successful backup. Configure the monitor with a 25 hour period, so a missing or failed backup raises an alert when pings stop. |
| `BACKUP_FAILURE_URL` | After a failed backup (for healthchecks.io: the heartbeat URL with `/fail` appended). Optional, gives an immediate alert. |

Both are plain GET requests with a 10 second timeout and 3 retries. A failing ping is logged as `backup.ping_failed` and never stops the loop. Set them in Coolify or `.env.prod`. Note that a backup container that is down altogether sends no failure ping, which is what the heartbeat covers.

Run a backup on demand: `docker compose -f docker-compose.prod.yml exec backup backup.sh`.

## Coolify instance data
Coolify keeps its configuration (applications, secrets, server keys) in its own Postgres database and `/data/coolify`.
1. In the Coolify UI, under Settings > Backup, enable the scheduled backup of the instance database to the same S3 storage (prefix `coolify/`).
2. The Hetzner server backup covers `/data/coolify` (including the `APP_KEY` in `/data/coolify/source/.env`). Keep a copy of `APP_KEY` in the password manager: without it a restored Coolify database cannot decrypt its secrets.

## Restore test
`tools/backup/restore-test.sh` restores a dump into a throwaway `pgvector/pgvector:pg17` container and verifies it (finished Prisma migrations, public tables, `vector` extension). It exits non-zero on failure and removes the container afterwards.

```sh
# From the latest dump in object storage (needs the AWS CLI and the BACKUP_S3_* variables, with
# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY set to the backup key)
tools/backup/restore-test.sh --latest

# From a local file
tools/backup/restore-test.sh ./bibi-20261015T023000Z.dump
```

CI runs this automatically (`.github/workflows/backup-restore.yml`): it builds the backup image, dumps a migrated database with `backup.sh` in local mode and runs the restore test on the dump. It runs on changes to `docker/backup/`, `tools/backup/` and the workflow itself, and weekly (Monday 05:00 UTC), so a Postgres or pgvector image upgrade that breaks dump or restore fails CI. When you change the Postgres image tag, update it in `docker/backup/Dockerfile`, `tools/backup/restore-test.sh` and the workflow together.

Repeat the test against production dumps after changing the backup setup, after a Postgres major upgrade, and at least quarterly.

## Restoring production
1. Stop `web`, `mcp` (and the worker) so nothing writes during the restore.
2. Download the dump you want and copy it into the postgres container.
3. Recreate the database: `dropdb -U bibi bibi && createdb -U bibi bibi`.
4. `pg_restore -U bibi -d bibi --no-owner --exit-on-error /tmp/bibi.dump`
5. Start the services. The `migrate` step applies any migration newer than the dump.

Data written after the dump (up to 24 hours) is lost. The server backup is the fallback when the bucket is unavailable.

## Restore test log
Record every test here. The ADR 0013 gate ("restore is tested before the first customer") is met by a production entry from `--latest`.

| Date | Source | Result | By |
| --- | --- | --- | --- |
| 2026-10-15 | Dump of the development schema (11 migrations), local file | OK: 11 migrations, 39 tables, `vector` present | Claude (ticket #75) |
| _pending_ | Latest production dump (`--latest`) | Not yet performed: no production environment exists | |
