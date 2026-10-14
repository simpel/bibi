# 0014 – System logging

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- `AuditLog` (ADR 0006) logs successful mutations in the database. It is the business trail: who changed what.
- Everything else was invisible: queries, denied and invalid calls, internal errors, sign-ins, emails, AI runs and afterCommit failures (which were swallowed silently). Debugging relied on scattered `console.*`.
- A call often passes through several surfaces (web chat → AI → MCP → core). Without a common ID the chain cannot be followed.
- Okazi does not store health data per guest, only aggregates (for example 13 guests, of which 3 with allergies). Logs must still not become a leak of personal data such as names and emails.

## Decision
- **Two layers, different purposes.**
  - `AuditLog` (database): successful mutations, in the same transaction as the change. Unchanged, but the row gets `requestId` and `surface`.
  - System log (stdout, JSON): **every** operation and every system event. Collected by the operations environment (ADR 0013).
- **Package `@okazi/logger`** (pino). The only way to log. `console.*` is forbidden in app code (Biome `noConsole`).
- **Events, not sentences.** Every line has a stable `event` (`<area>.<event>`, for example `operation.completed`, `http.request`, `auth.request`, `mail.sent`). Fields are structured, so the log can be queried.
- **Request context via `AsyncLocalStorage`.** Every entry point (web, GraphQL, REST, MCP, chat, CLI) opens a context with `requestId` and `surface`. After authentication, `organizationId`, `userId` and `actorType` are added. All lines within the call get the fields automatically.
- **Correlation.** An incoming `x-request-id` is reused if valid, otherwise a new one is created. The response sends it back. The assistant passes it on to MCP, so the whole AI chain shares the ID.
- **Core logs every `execute`.** One line per call regardless of outcome:
  - `operation.completed` (info): success.
  - `operation.rejected` (warn): validation, permission, not found, conflict.
  - `operation.failed` (error): internal error, with cause and stack.
  - `operation.afterCommitFailed` (error): for example search indexing.
  - Fields: operation, kind, entityType, outcome, error code, `durationMs` and actor.
- **No payload in the log.** Input and output are never logged. That belongs in `AuditLog`, which is org-scoped and permission-controlled. As an extra safeguard, known secret fields (password, token, cookie, API key) are redacted. Email addresses are logged only as the domain.
- **Level and format via `@okazi/config`.** `LOG_LEVEL` (default `info`, `silent` in test). `LOG_FORMAT` `json` or `pretty` (default `pretty` in development).
- **Process errors.** Next `onRequestError` and Node `uncaughtException`/`unhandledRejection` are logged as `process.*`/`http.unhandledError`.

## Addendum 2026-10-14
- The system log is also stored in Postgres (`SystemLog`) for the platform admin's view, with retention through `SYSTEM_LOG_RETENTION_DAYS`. See ADR 0015.

## Consequences
- A new entry point must use `withRequestLogging` (HTTP) or `runWithLogContext`. Otherwise `surface` becomes `system` and `requestId` is missing. The tests in each adapter catch this.
- Queries are logged at info level. Volume is controlled with `LOG_LEVEL` and retention in the operations log layer.
- `AuditLog` and the system log are linked with `requestId`.
- **Open:**
  - Log destination in operations (Loki, Better Stack, Axiom) and retention. Decided together with ADR 0013.
  - `AuditLog` has no read operations in graph, REST and MCP (parity).
