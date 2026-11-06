# 0031 – Staging, monitoring and log receiver

- **Date:** 2026-10-15
- **Status:** Accepted
- **Related:** 0013, 0014, 0015, 0027

## Context
- Hosting and logging (ADR 0013, 0014) left open staging, uptime and error tracking, and the external log receiver.
- There are no production users yet.

## Decision
1. Production only for now. Add staging before the first paying venue.
2. Better Stack (EU-hosted) for uptime, error tracking and log receiving.
3. pino JSON to stdout is shipped to Better Stack, kept 30 days. `SystemLog` stays the in-app source for `/admin`.

## Rejected
- Loki or Axiom plus a separate error tracker: two tools where one will do.

## Consequences
- Accepted risk until staging exists: changes are verified on a worktree database and in CI, not on a shared environment.
- Follow-up: set up Better Stack shipping, uptime checks and error tracking.
