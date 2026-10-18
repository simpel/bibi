# 0027 – Job scheduler: pg-boss in `apps/worker`

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Several decisions require jobs outside a request:
  - `ticket.expireHolds` moves lines in an `expires` state to their type's expiry state when the ticket's `holdsUntil` date has passed (ADR 0044).
  - Embeddings must be computed asynchronously (ADR 0008, issue #11).
  - Outgoing email needs retries (ADR 0012).
- ADR 0013 leaves the choice open: a cron container or a job queue in Postgres. The requirements are one server, no extra infrastructure and configuration in git.
- Alternatives:
  - **Coolify scheduled task**: cron only. Gives neither queue nor retries, the configuration lives in Coolify's database and it cannot be run locally.
  - **Graphile Worker**: comparable queue in Postgres, but a smaller ecosystem.
  - **pg-boss**: queue and cron in Postgres. Retries, singleton keys and a cron lock mean a schedule is run by only one instance.

## Decision
- **Library:** pg-boss against the same Postgres as the app. It uses its own schema (`pgboss`) that pg-boss migrates itself, outside Prisma.
- **Process:** a new app `apps/worker` that runs as its own service from the same Docker image as web and mcp (ADR 0013), and locally via `pnpm dev`. The web app and MCP only put jobs on the queue (`send`) and never run them.
- **Job = core operation:** each job calls a core operation through `execute`. No business logic lives in the worker.
  - The job runs in `runWithLogContext` with `surface: "system"` and a `requestId` per job (ADR 0014).
  - The actor is SYSTEM. Audit writes `actorType = SYSTEM`.
- **Tenancy:** a scheduled job iterates the organizations and runs the operation once per organization with an org-scoped context (ADR 0004). A failure in one organization does not stop the others. It is logged as error with `organizationId`.
- **Job definitions in git:** queues, cron expressions and retry settings are defined in code in `apps/worker`. No schedules are set in Coolify's UI.
- **Schedules (time zone Europe/Stockholm):**

  | Job | Schedule |
  |---|---|
  | `ticket.expireHolds` | every 15 minutes |
  | Embeddings | queued on change |
  | Outgoing email with retries | queued on send |
- **Idempotency:** jobs must tolerate being run again. `ticket.expireHolds` touches only lines that are still in an `expires` state.
- **Configuration:** `DATABASE_URL` is read through `@okazi/config` as in the other apps. No new secrets.

## Consequences
- One more container in `docker-compose.prod.yml`, but no new infrastructure (no Redis).
- The `pgboss` schema lives outside Prisma. The migration check and the backup (`pg_dump`) must include it.
- Manual execution remains: `ticket.expireHolds` is an ordinary operation that can also be called from web, GraphQL, REST and MCP (ADR 0003).
- Resolves the open question about a scheduler in ADR 0013 and in `CLAUDE.md`.
