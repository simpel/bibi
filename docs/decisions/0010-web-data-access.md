# 0010 – Web data access

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
ADR 0003 says "reads via GraphQL". The web app (`apps/web`) is Next.js with server components and server actions. It runs in the same process as the GraphQL and REST handlers and already has a signed-in session. If the web app read through GraphQL over HTTP against itself, it would have to forward cookies, handle an extra network hop and generate types for the queries.

## Decision
- The web app reads and writes through a single layer, `apps/web/src/server/run-operation.ts`. It resolves the caller with `resolveExecuteContext({ headers })` (the same resolver as GraphQL, REST and MCP) and runs core `execute` with the indexing hook. Server components call it for reads, server actions for commands.
- The web app never builds its own `ExecuteContext` and never imports `@okazi/db`.
- GraphQL (`/api/graphql`) and REST (`/api/v1`) remain for external callers, MCP's generic read tools and integrations. The parity principle in ADR 0003 applies unchanged, because the web app uses exactly the same operations, permissions and audit.
- Every core operation must have a web surface or an exception with a reason. This is governed by `apps/web/src/features/web-surfaces.ts` and a test.
- The AI assistant still goes through MCP (ADR 0007), not through this layer.

## Consequences
- Fewer hops and no cookie forwarding. Types come directly from the operations' Zod schemas.
- The web app's reads are limited to what the operations return. Graph edges (for example `Venue.rooms`) are replaced by separate operation calls (`room.list`). If free-form graph reads are needed in the web app, a GraphQL mode can be added later without changing the operations.
- Client components must not import `@okazi/core` (it pulls in Prisma). Forms and client-safe parts get Zod schemas from `@okazi/core/schemas` (see the addendum below).

## Addendum 2026-10-13 – the AI phase
- The path alias `@core-schema/*` is removed. `@okazi/core/schemas` (`packages/core/src/schemas.ts`) is a client-safe sub-package that only re-exports the features' `schema.ts` (Zod, no Prisma or fs imports). `@okazi/ai/ui` derives its wire schemas from the same file, so core fields follow along without hand-copied mirrors. That no Prisma ends up in the client bundle is checked with `next build` and a search in `.next/static`.
- The assistant's path differs from the web app's: `/api/chat` and `/api/assistant/approval` (`@okazi/ai`) connect as the user to `apps/mcp` with a first-party token (`getFirstPartyAccessToken`, client `assistant`) and do not run `runOperation`. The web app still uses `runOperation` for conversation history (list, open, rename, archive) and for Skills. After an approved proposal, the card calls `router.refresh()` so the server components reload data.
- That `UI_EXEMPT` is empty means all operations have a web surface. Operations whose UI lives in the shell (the assistant panel) are listed with `route: "*"` and the component file that provides the UI.

## Addendum 2026-10-14 – configurable domain
- `Room` and `room.*` are replaced by `Item` and `item.*` (ADR 0021). The example above becomes `item.list` filtered by venue.
