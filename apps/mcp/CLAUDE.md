# @bibi/mcp – context for Claude

The MCP server (ADR 0003, 0007). Thin adapter: all logic and permissions live in `@bibi/core`. The web app is an MCP client against this server as the signed-in user, and external clients (Claude Desktop, Inspector) use the same tools.

## Tools
- Generated from the core operations (`server/create-tools.ts`): one tool per operation, name = operation name with `.` → `_` (`venue_create`, `item_list`, `search`). Description, input and output are derived from the operation (Zod → `z.toJSONSchema`, dates as `date-time`). Result in `structuredContent` plus the same JSON as text. Errors via core `toMcpError` (`isError`).
- MCP-specific metadata is declared per feature: `src/features/<entity>/mcp.ts` with `mcpTool({ operation, destructive?, idempotent?, summary? })` (`search` in `src/search-mcp.ts`). Registered in `tools/meta-registry.ts`. A new operation is about 5 lines. `listMcpToolNames()` is used by the parity test.
- **Dynamic description (ADR 0021):** `item_list`, `item_get`, `item_create` and `item_update` get an organization section in `tools/list`. `createTools` is cached per embed and org-agnostic, so the `ListTools` handler (`create-mcp-server.ts`) calls `withOrgDescriptions` (`tools/org-tool-descriptions.ts`), which reads `entityType.list` (base ITEM) and `vocabulary.list` as the caller via `execute`, and `describeOrgFields` (`tools/describe-org-fields.ts`, pure function) builds one line per type: capabilities and fields (key, name, kind, required, allowed values as `name=id` for vocabularies or raw options). Max about 4,000 characters, otherwise `(truncated, use entityType_list)`. If `configuration:read` is missing, the static description is used (debug log `mcp.orgDescriptionsSkipped`). No special db path.
- Annotations: `readOnlyHint` for queries, `destructiveHint` for archive, `idempotentHint` where it fits.
- Commands with `approval: false` (`conversation_create`, `conversation_rename`, `message_append`) run directly even for the AI actor, and their `outputSchema` has no `approval_required` variant.
- AI tools: `conversation_*`, `message_list`/`message_append`, `skill_list`/`skill_get`/`skill_export` (read) and `skill_create|update|publish|archive|share|import` (proposal + approval).
- Generic: `graphql_schema` (SDL + hint) and `graphql_query({ query, variables?, operationName? })`. Read-only: the document is parsed and mutation/subscription is rejected before execution, max 10,000 characters, response max 200,000 characters. Runs via `createGraphqlHandler` (development false: depth/cost limits, no introspection) with the caller's context.
- The server uses the low-level `Server` from `@modelcontextprotocol/sdk` 1.32.1 (not `McpServer.registerTool`): Zod 4.1 is not fully supported by the SDK's conversion (dates, descriptions), and input is validated once anyway by core `execute`.

## Approval flow (human-in-the-loop)
- When `requiresApproval({ operation, actor })` is true (AI actor + command), **nothing** runs. The tool responds (`structuredContent`, no `isError`):
  `{ status: "approval_required", operation, input, summary, approvalToken, expiresAt }`.
  Input and permissions are checked first, so the user is never shown a proposal that would fail anyway.
- `approvalToken` = `base64url(claims).base64url(HMAC-SHA256)` (`src/approval/`), key `BETTER_AUTH_SECRET`, valid 10 min, bound to operation, input (hash), organization and user. The input is in the token, so no server state is needed.
- **The web app calls `approval_confirm({ approvalToken })` when the user clicks Approve**, with the user's own credentials and **without** `x-bibi-actor: ai`. The model must not and cannot call it: the tool is hidden in `tools/list` for the AI actor and rejected with FORBIDDEN if the caller is `ai`.
- `approval_confirm` verifies the token (signature, expiry, org + user), consumes it (single use, per process) and runs the operation as actor `ai` with the token's `conversationId`. AuditLog gets `actorType=AI`, `actorId=<the user the AI acted for>`, `approvedBy=<approving user>` (the same person, the token is bound to the user) and `conversationId`.
- Cancel = drop the token (no call needed). Expired token: ask the model to propose again.
- Errors on confirmation: `FORBIDDEN` (invalid/expired/wrong user/AI caller), `CONFLICT` (already used), `NOT_FOUND` (unknown operation) and the operation's own errors.

## HTTP
- `src/http.ts`: `node:http` server (`PORT`, default 3001) that translates to Web Request/Response (`src/http/`). Stateless Streamable HTTP, one server + transport per call.
- `POST /mcp` – authenticates with `@bibi/auth` `resolveExecuteContext({ headers })` (session, API key `bib_…`, OAuth bearer). Missing/invalid login → 401 with `WWW-Authenticate: Bearer resource_metadata="<MCP_URL>/.well-known/oauth-protected-resource"`; FORBIDDEN → 403.
- `GET /.well-known/oauth-protected-resource` (RFC 9728): `resource` = `<MCP_URL>/mcp`, `authorization_servers` = Better Auth base (`BETTER_AUTH_URL` + `/api/auth`).
- `GET /health`. Other methods on `/mcp` → 405. Browser calls (header `Origin`) are allowed only from `WEB_URL`; CORS preflight is supported.

## Connecting a client
- HTTP (Inspector): `npx @modelcontextprotocol/inspector`, choose Streamable HTTP, URL `http://localhost:3001/mcp`, header `Authorization: Bearer bib_<api-key>` (or OAuth).
- stdio (Claude Desktop `claude_desktop_config.json`):
  ```json
  { "mcpServers": { "bibi": {
    "command": "pnpm", "args": ["--filter", "@bibi/mcp", "dev:stdio"],
    "cwd": "/path/to/bibi",
    "env": { "BIBI_API_KEY": "bib_…", "DATABASE_URL": "…", "BETTER_AUTH_SECRET": "…", "BETTER_AUTH_URL": "http://localhost:3000" } } } }
  ```
  `src/stdio.ts` resolves the key once at startup (stdout is the protocol, logging goes to stderr).

## Environment variables (all via `@bibi/config`)
`DATABASE_URL`, `BETTER_AUTH_SECRET` (signs approval tokens), `BETTER_AUTH_URL`, `MCP_URL`, `WEB_URL`, `PORT` (3001), `BIBI_API_KEY` (stdio only), `WEB_OAUTH_CLIENT_ID` (AI actor).

## Scripts
`dev` (tsx watch), `dev:stdio`, `build` (tsup → `dist/`, workspace packages are bundled, npm packages are external and listed in package.json), `start` (`node dist/http.js`), `start:stdio`, `typecheck`, `test`.

## Good to know
- `embed` (`src/embed.ts`) = `createEmbed()` from `@bibi/ai/embed` (AI Gateway, model chosen in `/admin/ai-models`). Without `AI_GATEWAY_API_KEY`: a deterministic placeholder outside production, a clear error in production.
- Single-use tokens are tracked in memory per process. Multiple instances need a shared store for strict single use (the token is still bound and valid for 10 min).
- The GraphQL handler gets the caller's context via an internal relay header (`graphql/context-relay.ts`), never from the client.

## Tests
Vitest against a real Postgres, in-memory client (`InMemoryTransport`). `test/parity.test.ts` is the parity test for REST, GraphQL, MCP and entity reads across all three surfaces. Web parity is tested separately in `apps/web/src/features/web-surfaces.test.ts`. The entities and how they are read per surface are in `test/parity-entities.ts` (message is read via lists/the graph edge). Test resolver for HTTP: header `x-test-org`.
