# @okazi/core – kontext för Claude

Paritetskärnan: varje förmåga definieras **en gång** som en operation och exponeras sedan likadant i webb, GraphQL, REST och MCP.

## Operationer
- `defineOperation({ name, kind, description, input, output, permission, handler, approval?, embeddable?, entityType? })`.
  - `name` = `<entitet>.<verb>` (t.ex. `venue.create`), stabilt i alla ytor. `description` skrivs för både människor och LLM:er.
  - `input`/`output` är Zod-scheman; `permission` = `<resurs>:read|write|admin`.
  - `handler({ input, context })` returnerar `Result` (`ok({ value })` / `err({ error: AppError })`) – kasta aldrig strängar.
  - Kommandon anropar `context.recordChange({ entityId, before, after })` för auditraden.
- Kör alltid via `execute({ operation, input, context, afterCommit? })`: Zod-validering → behörighet → handler → output-validering → AuditLog (kommandon, i samma transaktion) → `afterCommit`-hooks (t.ex. `createIndexingHook({ embed })`).
- `context.db` är `scopedDb` – org-scoping kan inte kringgås. Bygg kontext med `createExecuteContext({ organizationId, actor, roles })`.
- `requiresApproval({ operation, actor })`: kommandon kräver mänskligt godkännande när `actor.type === "ai"` (standard `approval: true`).
- Registret: `registerOperations({ operations: createCoreOperations({ embed }) })`, `listOperations()`, `getOperation({ name })`. Adaptrar genererar verktyg/endpoints från registret.

## Fel
- `AppError` med koder `NOT_FOUND | FORBIDDEN | UNAUTHENTICATED | VALIDATION | CONFLICT | INTERNAL`.
- Ytor mappar med `toHttpStatus`, `toGraphqlExtensions`, `toMcpError` – inga egna mappningar.

## Feature-mappar (`src/features/<entitet>/`)
- Fasta filnamn: `schema.ts` (Zod), `operations.ts` (list/get/create/update/archive), `embeddable.ts`. Adaptrar (`graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`) läggs till av respektive yta. Ny entitet: `pnpm gen entity`.
- Arkivering = soft delete (`status: ARCHIVED`), aldrig hård radering.

## Sök
- Sökbar entitet implementerar `Embeddable` (`entityType`, `toText({ entity })`, `load({ ids, db })`) och sätts som `embeddable` på sina kommandon.
- `createSearchOperation({ embed })` – hybrid FTS + vektor (RRF), org-scopad. `embed({ texts })` injiceras av appen; core har inget AI SDK-beroende.

## Tester
- Vitest mot riktig Postgres (`docker compose up -d postgres`, `pnpm db:migrate`), inga mockar. Varje test skapar egen org via `testContext()`. Deterministisk `fakeEmbed` i `test/fake-embed.ts`.
