# @okazi/mcp – kontext för Claude

MCP-servern (ADR 0003, 0007). Tunn adapter: all logik och behörighet ligger i `@okazi/core`. Webben är MCP-klient mot denna server som inloggad användare, och externa klienter (Claude Desktop, Inspector) använder samma verktyg.

## Verktyg
- Genereras ur core-operationerna (`server/create-tools.ts`): ett verktyg per operation, namn = operationsnamn med `.` → `_` (`venue_create`, `room_list`, `search`). Beskrivning, in- och utdata härleds ur operationen (Zod → `z.toJSONSchema`, datum som `date-time`). Resultat i `structuredContent` plus samma JSON som text. Fel via core `toMcpError` (`isError`).
- MCP-specifik metadata deklareras per feature: `src/features/<entitet>/mcp.ts` med `mcpTool({ operation, destructive?, idempotent?, summary? })` (`search` i `src/search-mcp.ts`). Registreras i `tools/meta-registry.ts`. Ny operation ≈ 5 rader. `listMcpToolNames()` används av paritetstestet.
- Annotationer: `readOnlyHint` för queries, `destructiveHint` för archive, `idempotentHint` där det passar.
- Generiska: `graphql_schema` (SDL + hint) och `graphql_query({ query, variables?, operationName? })`. Endast läsning: dokumentet parsas och mutation/subscription avvisas innan körning, max 10 000 tecken, svar max 200 000 tecken. Körs via `createGraphqlHandler` (development false: djup-/kostnadsgränser, ingen introspektion) med anroparens kontext.
- Servern använder lågnivå-`Server` från `@modelcontextprotocol/sdk` 1.32.1 (inte `McpServer.registerTool`): Zod 4.1 stöds inte fullt ut av SDK:ns konvertering (datum, beskrivningar), och indata valideras ändå en gång av core `execute`.

## Godkännandeflöde (human-in-the-loop)
- När `requiresApproval({ operation, actor })` är sant (AI-aktör + kommando) körs **inget**. Verktyget svarar (`structuredContent`, ingen `isError`):
  `{ status: "approval_required", operation, input, summary, approvalToken, expiresAt }`.
  Input och behörighet kontrolleras först, så användaren får aldrig ett förslag som ändå skulle misslyckas.
- `approvalToken` = `base64url(claims).base64url(HMAC-SHA256)` (`src/approval/`), nyckel `BETTER_AUTH_SECRET`, giltig 10 min, bunden till operation, indata (hash), organisation och användare. Indata ligger i token, så ingen server-state behövs.
- **Webben anropar `approval_confirm({ approvalToken })` när användaren klickar Godkänn**, med användarens egna uppgifter och **utan** `x-okazi-actor: ai`. Modellen får inte och kan inte anropa det: verktyget är dolt i `tools/list` för AI-aktören och avvisas med FORBIDDEN om anroparen är `ai`.
- `approval_confirm` verifierar token (signatur, utgång, org + användare), förbrukar den (engångs, per process) och kör operationen som aktör `ai` med token-ets `conversationId`. AuditLog får `actorType=AI`, `actorId=<godkännande användare>`, `conversationId`. Core saknar kolumn för `approvedBy`; `actorId` är den som godkände.
- Avbryt = släpp token (ingen anrop behövs). Utgången token: be modellen föreslå på nytt.
- Fel vid bekräftelse: `FORBIDDEN` (ogiltig/utgången/fel användare/AI-anropare), `CONFLICT` (redan använd), `NOT_FOUND` (okänd operation) samt operationens egna fel.

## HTTP
- `src/http.ts`: `node:http`-server (`PORT`, standard 3001) som översätter till Web Request/Response (`src/http/`). Stateless Streamable HTTP, en server + transport per anrop.
- `POST /mcp` – autentiserar med `@okazi/auth` `resolveExecuteContext({ headers })` (session, API-nyckel `okz_…`, OAuth-bearer). Saknad/ogiltig inloggning → 401 med `WWW-Authenticate: Bearer resource_metadata="<MCP_URL>/.well-known/oauth-protected-resource"`; FORBIDDEN → 403.
- `GET /.well-known/oauth-protected-resource` (RFC 9728): `resource` = `<MCP_URL>/mcp`, `authorization_servers` = Better Auth-bas (`BETTER_AUTH_URL` + `/api/auth`).
- `GET /health`. Övriga metoder på `/mcp` → 405. Webbläsaranrop (header `Origin`) tillåts bara från `WEB_URL`; CORS-preflight stöds.

## Ansluta en klient
- HTTP (Inspector): `npx @modelcontextprotocol/inspector`, välj Streamable HTTP, URL `http://localhost:3001/mcp`, header `Authorization: Bearer okz_<api-nyckel>` (eller OAuth).
- stdio (Claude Desktop `claude_desktop_config.json`):
  ```json
  { "mcpServers": { "okazi": {
    "command": "pnpm", "args": ["--filter", "@okazi/mcp", "dev:stdio"],
    "cwd": "/sökväg/till/okazi",
    "env": { "OKAZI_API_KEY": "okz_…", "DATABASE_URL": "…", "BETTER_AUTH_SECRET": "…", "BETTER_AUTH_URL": "http://localhost:3000" } } } }
  ```
  `src/stdio.ts` löser nyckeln en gång vid start (stdout är protokollet, loggning till stderr).

## Miljövariabler (alla via `@okazi/config`)
`DATABASE_URL`, `BETTER_AUTH_SECRET` (signerar godkännandetoken), `BETTER_AUTH_URL`, `MCP_URL`, `WEB_URL`, `PORT` (3001), `OKAZI_API_KEY` (endast stdio), `WEB_OAUTH_CLIENT_ID` (AI-aktör).

## Skript
`dev` (tsx watch), `dev:stdio`, `build` (tsup → `dist/`, workspace-paket bundlas, npm-paket är externa och listade i package.json), `start` (`node dist/http.js`), `start:stdio`, `typecheck`, `test`.

## Att veta
- `embed` är ännu `unconfiguredEmbed` (`src/embed.ts`); `search` och omindexering fungerar först när `@okazi/ai` kopplas in i `http.ts`/`stdio.ts`.
- Engångstoken spåras i minnet per process. Flera instanser kräver delat lager för strikt engångsbruk (token är ändå bunden och giltig 10 min).
- GraphQL-hanteraren får anroparens kontext via en intern relay-header (`graphql/context-relay.ts`), aldrig från klienten.

## Tester
Vitest mot riktig Postgres, in-memory-klient (`InMemoryTransport`). `test/parity.test.ts` är paritetstestet (REST, GraphQL, MCP, plus entitetsläsning i alla tre; `WEB_SURFACES` är kroken för webben). Test-resolver för HTTP: header `x-test-org`.
