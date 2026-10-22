# 0010 – Web data access

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
ADR 0003 says "reads via GraphQL". The web app (`apps/web`) is Next.js with server components and server actions. It runs in the same process as the GraphQL and REST handlers and already has a signed-in session. If the web app read through GraphQL over HTTP against itself, it would have to forward cookies, handle an extra network hop and generate types for the queries.

## Decision
- The web app reads and writes through a single layer, `apps/web/src/server/run-operation.ts`. It resolves the caller with `resolveExecuteContext({ headers })` (the same resolver as GraphQL, REST and MCP) and runs core `execute` with the indexing hook. Server components call it for reads, server actions for commands.
- The web app never builds its own `ExecuteContext` and never imports `@bibi/db`.
- GraphQL (`/api/graphql`) and REST (`/api/v1`) remain for external callers, MCP's generic read tools and integrations. The parity principle in ADR 0003 applies unchanged, because the web app uses exactly the same operations, permissions and audit.
- Every core operation must have a web surface or an exception with a reason. This is governed by `apps/web/src/features/web-surfaces.ts` and a test.
- The AI assistant still goes through MCP (ADR 0007), not through this layer.

## Consequences
- Fewer hops and no cookie forwarding. Types come directly from the operations' Zod schemas.
- The web app's reads are limited to what the operations return. Graph edges (for example `Venue.items`) are replaced by separate operation calls (`item.list`). If free-form graph reads are needed in the web app, a GraphQL mode can be added later without changing the operations.
- Client components must not import `@bibi/core` (it pulls in Prisma). Forms and client-safe parts get Zod schemas from `@bibi/core/schemas` (see the addendum below).

## Addenda
- 2026-10-13: `@bibi/core/schemas` is the client-safe re-export of the features' `schema.ts` (the old `@core-schema/*` alias is gone); `@bibi/ai/ui` derives its wire schemas from it. The assistant does not use `runOperation`: `/api/chat` and `/api/assistant/approval` connect to `apps/mcp` as the user with a first-party token. Operations whose UI lives in the shell are listed in `web-surfaces.ts` with `route: "*"`.
- 2026-10-14: `Room` became `Item` (ADR 0021).
- 2026-10-15: the one exception to "never import `@bibi/db`": `apps/web/src/instrumentation-node.ts` imports `createSystemLogSink` at startup to write process logs to Postgres (ADR 0014, 0015). It sits outside the request context and touches no request data.
