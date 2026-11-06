# 0010 – Web data access

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- ADR 0003 says reads go via GraphQL, but the Next.js web app runs in the same process as the handlers and already has a session.
- Reading through GraphQL over HTTP against itself would need cookie forwarding, an extra hop and generated query types.

## Decision
1. The web app reads and writes through one layer, `run-operation`. It resolves the caller with `resolveExecuteContext` (the same resolver as GraphQL, REST and MCP) and runs core `execute`. Server components use it for reads, server actions for commands.
2. The web app never builds its own `ExecuteContext` and never imports `@bibi/db`. The one exception is the startup hook that writes process logs to Postgres (ADR 0014, 0015).
3. GraphQL and REST remain for external callers, MCP's generic reads and integrations. Parity (ADR 0003) is unchanged, since the same operations, permissions and audit apply.
4. Every core operation has a web surface or a listed exception with a reason, enforced by a test.
5. The assistant does not use this layer. It connects to `apps/mcp` as the user (ADR 0007).
6. Client components never import `@bibi/core`, which pulls in Prisma. They use the client-safe `@bibi/core/schemas`.

## Rejected
- GraphQL over HTTP from the web app to itself: extra hop and cookie forwarding for no gain.

## Consequences
- Fewer hops, and types come straight from the operations' Zod schemas.
- Web reads are limited to what operations return; graph edges become separate operation calls.
- A GraphQL mode can be added later without changing the operations.
