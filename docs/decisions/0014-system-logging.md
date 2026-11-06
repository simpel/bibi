# 0014 – System logging

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- `AuditLog` (ADR 0006) is the business trail of successful mutations. Everything else was invisible: denied calls, errors, sign-ins, mail, AI runs and swallowed after-commit failures.
- One call passes through several surfaces (chat, AI, MCP, core). Without a shared id the chain cannot be followed.
- Logs must not leak personal data.

## Decision
1. Two layers with different purposes. `AuditLog` (database, same transaction) records successful mutations. The system log (JSON on stdout) records every operation and system event.
2. `@bibi/logger` (pino) is the only way to log. `console.*` is forbidden.
3. Lines are events, not sentences. Each has a stable `event` named `<area>.<event>` and structured fields.
4. Every entry point opens a request context with `requestId` and `surface` (`AsyncLocalStorage`). Organization, user and actor type are added after authentication. An incoming valid `x-request-id` is reused and passed down to MCP so the whole AI chain shares it.
5. Core `execute` logs one line per call: completed, rejected (validation, permission, not found, conflict), failed, or after-commit failed.
6. Input and output are never logged; that belongs in `AuditLog`, which is permission-controlled. Known secret fields are redacted and emails are logged only as a masked form.
7. The log is also stored in Postgres for the superadmin view with retention (ADR 0015). `AuditLog` is readable through `auditLog.list|get` (`audit:read`).

## Rejected
- Logging payloads for easier debugging: the log would become a leak of personal data outside org scoping.
- Scattered `console.*`: no structure, no correlation.

## Consequences
- A new entry point must use `withRequestLogging` or `runWithLogContext`, or `surface` becomes `system` and `requestId` is missing. Adapter tests catch this.
- Queries are logged at info level; volume is controlled with `LOG_LEVEL` and retention.
- `AuditLog` and the system log join on `requestId`.
- Open: an external log destination (ADR 0013).
