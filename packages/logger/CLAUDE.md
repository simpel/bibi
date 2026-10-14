# @okazi/logger – kontext för Claude

Systemloggen (ADR 0014). pino, en JSON-rad per händelse till stdout (stderr för stdio-MCP).

## API
- `getLogger().info({ event: "mail.sent", ...fält })`. Nivåer: trace, debug, info, warn, error, fatal. `err` serialiseras med stack och cause. `msg` blir `event` om det saknas.
- `initLogger({ service, stream?, sinks? })` en gång per process. `sinks` = extra destinationer från info-nivå, i dag `createSystemLogSink` från `@okazi/db`. (web: `instrumentation-node.ts`, mcp: `http.ts`/`stdio.ts`). `installProcessHandlers({ exitOnUncaught })` loggar `process.*`.
- `withRequestLogging({ surface, handler })`: öppnar request-kontexten, loggar `http.request` (status, durationMs; 4xx = warn, 5xx = error) och returnerar `x-request-id`. Inkommande giltigt `x-request-id` återanvänds.
- `runWithLogContext({ context, fn })`, `getLogContext()`, `addToLogContext({ fields })`. `resolveExecuteContext` lägger till `organizationId`, `userId`, `actorType` och `conversationId`.
- `maskEmail({ email })` → `***@doman.se`.

## Händelser i dag
`http.request`, `http.unhandledError`, `operation.completed|rejected|failed|afterCommitFailed`, `auth.resolveFailed|sessionCreated|library`, `mcp.toolCalled`, `approval.proposed|proposalRejected|decided|failed`, `ai.runCompleted|runFinishFailed|chatFailed|streamFailed|modelNotConfigured|modelCatalogFailed|placeholderEmbedder`, `auth.platformDenied`, `platformAdmin.granted|revoked`, `mail.sent|failed`, `process.started|startFailed|unhandledRejection|uncaughtException`, `config.ignored`.

## Regler
- Logga aldrig in- eller utdata. `AuditLog` har före/efter-bilden. Kända hemliga fältnamn redigeras ändå (`redact-paths.ts`).
- Ny ingång utan `withRequestLogging`/`runWithLogContext` får `surface: system` och inget `requestId`.

## Miljö
`LOG_LEVEL` (standard `info`, `silent` när `NODE_ENV=test`), `LOG_FORMAT` (`json` i produktion, annars `pretty`).

## Tester
`captureLogs()` styr processloggern till minnet: `logs.events({ event })`, `logs.restore()`. `createMemoryLogger()` för en fristående logger.
