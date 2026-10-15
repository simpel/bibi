# 0031 – Staging, monitoring and log receiver

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- ADR 0013 and 0014 leave open staging, uptime and error tracking, and the external log receiver (issue #13).
- The scheduler is already decided: pg-boss in `apps/worker` (ADR 0027).
- There are no production users yet (pilot stage).

## Decision
- **Staging: production only for now.** Add a second Coolify app (or small server) before the first paying venue.
- **Monitoring: Better Stack** (EU-hosted) for uptime checks, error tracking and the log receiver. One tool instead of Loki or Axiom plus a separate error tracker.
- **Logs:** pino JSON to stdout is shipped to Better Stack. `SystemLog` stays the in-app source for `/admin` (ADR 0014, 0015).
- **Retention:** 30 days in Better Stack. `SystemLog` keeps `SYSTEM_LOG_RETENTION_DAYS`.

## Consequences
- Accepted risk until staging exists: changes are verified on a worktree database and in CI (e2e), not on a shared environment.
- Follow-up: set up Better Stack (ship logs, uptime checks, error tracking).
- "Staging" is removed from `CLAUDE.md` open questions and replaced by "add staging before the first paying venue".
