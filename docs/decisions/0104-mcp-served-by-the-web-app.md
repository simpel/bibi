# 0104 – MCP is served by the web app

- **Date:** 2026-11-11
- **Status:** Accepted
- **Related:** 0013 (point 8 amended), 0003, 0005, 0007, 0027, 0073

## Context
- Every programmatic surface is a thin adapter over core operations (ADR 0003). REST (`/api/v1`) and GraphQL (`/api/graphql`) run inside the web app, but MCP ran as its own container (`apps/mcp`, :3331).
- ADR 0013's reason was that OAuth needs a stable public HTTPS URL for MCP. That needs its own host, not its own process.
- The extra container cost about 384 MB on a small server, one more image per release and a network hop for the assistant, while MCP traffic is low.

## Decision
1. **The web app serves MCP over Streamable HTTP** at `/mcp`, with `/health` beside it. The handler stays in `apps/mcp` (`createMcpHandler`) and is mounted by a Next route, the same way `@bibi/api` and `@bibi/graphql` are.
2. **`MCP_URL` stays the public MCP base URL and the OAuth resource** (tokens are audience-bound to `${MCP_URL}/mcp`). In production it stays `https://mcp.<domain>`, now routed to the web container, so connected clients keep their grants. Unset, it defaults to `WEB_URL`.
3. **`apps/mcp` runs on its own only over stdio** (Claude Desktop with an API key). There is no MCP container or image.
4. **Separation later is a deploy setting, not a rewrite:** when machine traffic needs isolating from staff traffic, run a second copy of the web image and point the API and MCP hosts at it.

## Rejected
- **Keep MCP separate and leave REST and GraphQL in web.** Two rules for the same kind of adapter, for isolation nothing needs yet.
- **Move REST, GraphQL and MCP into one API container.** Isolates all machine traffic, but costs another process and memory before any venue needs it.

## Consequences
- Heavy MCP traffic shares the web process with staff pages, as REST already did.
- Coolify routes `mcp.<domain>` to the web service's port (`docs/runbooks/deploy.md`); the deploy gate keeps checking `${MCP_URL}/health`.
- The single-use approval tokens are tracked per web process; more than one web instance needs a shared store (unchanged from before).
