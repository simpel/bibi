# 0027 – Job scheduler: pg-boss in `apps/worker`

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Some work must run outside a request: expiring holds when an order's hold date passes (ADR 0044), pseudonymising the audit log (ADR 0032), and possibly indexing and mail retries.
- Constraints from ADR 0013: one server, no extra infrastructure, configuration in git.

## Decision
1. pg-boss against the same Postgres, in its own `pgboss` schema that it migrates itself, outside Prisma.
2. A separate app, `apps/worker`, runs as its own service from the same image. Web and MCP only enqueue; they never run jobs.
3. A job is a core operation called through `execute` as SYSTEM, in a log context with `surface: "system"`. No business logic lives in the worker.
4. A scheduled job runs the operation once per organization with an org-scoped context (ADR 0004). A failure in one organization does not stop the others.
5. Queues, cron expressions and retries are defined in code, never in Coolify.
6. Jobs must be idempotent.

## Rejected
- Coolify scheduled tasks: cron only, no queue or retries, configuration outside git, cannot run locally.
- Graphile Worker: comparable queue, smaller ecosystem.

## Consequences
- One more container, no Redis.
- The `pgboss` schema must be included in the migration check and in `pg_dump`.
- A job's operation also exists on every surface (ADR 0003), so it can be run manually.
- Built so far: hold expiry and audit pseudonymisation. Indexing stays in-process (ADR 0030) and mail is sent after commit. Rules for adding a job: `apps/worker/CLAUDE.md`.
