# @okazi/logger – context for Claude

The system log (ADR 0014). pino, one JSON line per event to stdout (stderr for stdio MCP).

## API
- `getLogger().info({ event: "mail.sent", ...fields })`. Levels: trace, debug, info, warn, error, fatal. `err` is serialized with stack and cause. `msg` becomes `event` if it is missing.
- `initLogger({ service, stream?, sinks? })` once per process. `sinks` = extra destinations from info level, today `createSystemLogSink` from `@okazi/db`. (web: `instrumentation-node.ts`, mcp: `http.ts`/`stdio.ts`). `installProcessHandlers({ exitOnUncaught })` logs `process.*`.
- `withRequestLogging({ surface, handler })`: opens the request context, logs `http.request` (status, durationMs; 4xx = warn, 5xx = error) and returns `x-request-id`. An incoming valid `x-request-id` is reused.
- `runWithLogContext({ context, fn })`, `getLogContext()`, `addToLogContext({ fields })`. `resolveExecuteContext` adds `organizationId`, `userId`, `actorType` and `conversationId`.
- `maskEmail({ email })` → `***@domain.se`.

## Events
Stable `<area>.<event>` names; find existing ones with `rg "event: \""` before adding a new one.

## Rules
- Never log input or output. `AuditLog` has the before/after image. Known secret field names are redacted anyway (`redact-paths.ts`).
- A new entry point without `withRequestLogging`/`runWithLogContext` gets `surface: system` and no `requestId`.

## Environment
`LOG_LEVEL` (default `info`, `silent` when `NODE_ENV=test`), `LOG_FORMAT` (`json` in production, otherwise `pretty`).
`BETTER_STACK_HOST` + `BETTER_STACK_SOURCE_TOKEN` (both or neither): also ship every line at info and above to Better Stack over HTTP (`better-stack-sink.ts`, ADR 0031, runbook `docs/runbooks/deploy.md`).

## Tests
`captureLogs()` routes the process logger to memory: `logs.events({ event })`, `logs.restore()`. `createMemoryLogger()` for a standalone logger.
