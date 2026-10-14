# @okazi/core – kontext för Claude

Paritetskärnan: varje förmåga definieras **en gång** som en operation och exponeras sedan likadant i webb, GraphQL, REST och MCP.

## Operationer
- `defineOperation({ name, kind, description, input, output, permission, handler, approval?, embeddable?, entityType? })`.
  - `name` = `<entitet>.<verb>` (t.ex. `venue.create`), stabilt i alla ytor. `description` skrivs för både människor och LLM:er.
  - `input`/`output` är Zod-scheman; `permission` = `<resurs>:read|write|admin`.
  - `handler({ input, context })` returnerar `Result` (`ok({ value })` / `err({ error: AppError })`) – kasta aldrig strängar.
  - Kommandon anropar `context.recordChange({ entityId, before, after })` för auditraden.
- Kör alltid via `execute({ operation, input, context, afterCommit? })`: Zod-validering → behörighet → handler → output-validering → AuditLog (kommandon, i samma transaktion) → `afterCommit`-hooks (t.ex. `createIndexingHook({ embed })`).
- `execute` loggar exakt en rad per anrop: `operation.completed` / `operation.rejected` (VALIDATION, FORBIDDEN, NOT_FOUND m.fl.) / `operation.failed` (INTERNAL, med orsak). Misslyckade `afterCommit`-hooks loggas som `operation.afterCommitFailed`. AuditLog-raden får `requestId` och `surface` från request-kontexten (`surface: system` utanför en request). Se ADR 0014.
- `context.db` är `scopedDb` – org-scoping kan inte kringgås. Bygg kontext med `createExecuteContext({ organizationId, actor, roles, permissions })`. `permissions` (`PermissionSet`) löses av `packages/auth`; `hasPermission({ permissions, permission })` slår upp exakt. `roles` är bara namn för visning.
- `requiresApproval({ operation, actor })`: kommandon kräver mänskligt godkännande när `actor.type === "ai"` (standard `approval: true`).
- Klientsäkert underpaket `@okazi/core/schemas` (`src/schemas.ts`): bara zod-filerna (`features/*/schema.ts`, `search/search-schema.ts`). Importera det i klientkod och i `@okazi/ai/ui`; lägg en rad per ny entitets `schema.ts` där. Aldrig Prisma/fs/operationer i det.
- Registret: `registerOperations({ operations: createCoreOperations({ embed }) })`, `listOperations()`, `getOperation({ name })`. Adaptrar genererar verktyg/endpoints från registret.

## Plattformsoperationer (ADR 0015)
- `src/platform/`: `definePlatformOperation` och `executePlatform({ operation, input, context })` med `PlatformContext` (`createPlatformContext`, byggs bara av `resolvePlatformContext` i auth). Samma kedja som `execute`. Audit med `PLATFORM_SCOPE`. Handlers ser bara `PlatformDb` (`systemLog`, `aiSetting`).
- `createPlatformOperations({ listModels })`: `systemLog.list/get`, `aiFeature.list/update`, `aiModel.list`. Registreras **inte** i org-registret. Inte i GraphQL, REST eller MCP.
- `resolveAiModel({ feature })` → `Result<string>`: adminens val (cache 30 s). Ingen standard: ovald → `UNAVAILABLE` och `ai.modelNotConfigured` (error). `AI_FEATURES` är registret.

## Fel
- `AppError` med koder `NOT_FOUND | FORBIDDEN | UNAUTHENTICATED | VALIDATION | CONFLICT | INTERNAL | UNAVAILABLE` (503: funktionen saknar konfiguration, t.ex. AI-modell). `INTERNAL` och `UNAVAILABLE` loggas som `operation.failed` (error).
- Ytor mappar med `toHttpStatus`, `toGraphqlExtensions`, `toMcpError` – inga egna mappningar.

## Feature-mappar (`src/features/<entitet>/`)
- Fasta filnamn: `schema.ts` (Zod), `operations.ts` (list/get/create/update/archive), `embeddable.ts`. Adaptrar (`graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`) läggs till av respektive yta. Ny entitet: `pnpm gen entity`.
- Arkivering = soft delete (`status: ARCHIVED`), aldrig hård radering.

## AI-datalager (konversationer, meddelanden, skills)
- `conversation.*` (list/get/create/rename/archive) och `message.*` (list/append). Behörighet `conversation:read|write|admin`.
  - Konversationer är privata för `ownerUserId`. Org-admin/ägare (`conversation:admin`) och systemaktör får **läsa** alla (`get`, `message.list`, `conversation.list` med `allUsers: true`), men bara ägaren byter namn och lägger till meddelanden. Arkivera: ägare eller admin. Andra användare får `NOT_FOUND` (inte `FORBIDDEN`), så att existens inte läcker. Regeln ligger i `features/conversation/access.ts`.
  - `message.append`: `parts` = AI SDK `UIMessage`-parts (lagras som de är, endast `type`/`text` kontrolleras, max 256 kB), `metadata` fri JSON. `sequence` är 0-baserad och unik per konversation (konversationsraden låses först). AI-aktören får bara lägga till `ASSISTANT`/`TOOL` och bara i sin egen `conversationId`; `USER`/`SYSTEM` sparas av appen som användaren.
  - `conversation.create`, `conversation.rename` och `message.append` har `approval: false` (chattens egen bokföring). `conversation.archive` kräver godkännande.
- `skill.*`: list/get/export (`skill:read`), create/update/publish/archive/import (`skill:write`), share (`skill:admin`).
  - Synlighet (`features/skill/access.ts`): SYSTEM + ORGANIZATION för alla i org, PERSONAL bara för ägaren. SYSTEM är skrivskyddade, ORGANIZATION kräver admin, PERSONAL bara ägaren.
  - `skill.share` kopierar en egen personlig skill till ORGANIZATION som DRAFT (`source = share:<id>`). `skill.import` parsar SKILL.md (frontmatter `name` → slug, `metadata.title` → namn, `description`, `allowed-tools`; brödtext → instruktioner; resurser som `<!-- okazi:resource name="x" -->…<!-- /okazi:resource -->`) till DRAFT. `skill.export` ger `{ markdown, filename }`. Innehållsändring höjer `version`.
  - SYSTEM-skills: `src/skills/system/*.md`. `seedSystemSkills({ db?, embed?, directory? })` (importeras från `@okazi/core/seed`, **inte** från index – den läser filer och får inte hamna i webbens bundle) upsertar per `source = system:<fil>`, idempotent, höjer version vid ändring, arkiverar borttagna filer och indexerar globalt om `embed` ges. CLI: `pnpm --filter @okazi/core seed:skills`. Ingen AuditLog-rad (raderna saknar organisation; ändringar granskas som kod).
- `Actor.approvedBy` sätts endast av godkännandeflödet och sparas i `AuditLog.approvedBy`.

## Roller och medlemmar (ADR 0020)
- `role.list|get` (`role:read`), `role.create|update|archive|importTemplate` (`role:admin`), `member.list` (`member:read`), `member.assignRole` (`member:admin`). Rader i `organizationRole`/`member` (Better Auth-tabeller, org-scopade i `scopedDb`).
- `owner` är fast (id `"owner"` i `role.get`), kan inte skapas, ändras, tilldelas eller tas ifrån någon.
- Anti-eskalering (`features/role/access.ts`): ingen kan skapa, ändra eller tilldela en roll som ger mer än de själva har (system undantaget).
- Behörigheter normaliseras (admin ⇒ write ⇒ read). Namnbyte skriver om `member.role`. Arkivering nekas (CONFLICT) så länge någon har rollen.
- Mallar är data i `templates/roles/` (`conference-venue` = "Konferensgård") och växer med varje del av ADR 0025.
- Tester som skapar roller/medlemmar behöver en riktig `organization`-rad: `testOrg()` i `test/org-helpers.ts`.

## Demodata
- `seedDemo()` i `src/seed/demo/` (`@okazi/core/seed/demo`, CLI `seed:demo`). Specen är `docs/demo-seed.md`; `data/*.ts` följer den. Allt via `execute` som SYSTEM utom Better Auth-raderna i `users.ts`.

## Sök
- Sökbar entitet implementerar `Embeddable` (`entityType`, `toText({ entity })`, `load({ ids, db })`) och sätts som `embeddable` på sina kommandon.
- `createSearchOperation({ embed, embeddables? })` – hybrid FTS + vektor (RRF), org-scopad. `embed({ texts })` injiceras av appen; core har inget AI SDK-beroende.
- Ny sökbar entitet registreras i `search/embeddables.ts` (`SEARCHABLE_ENTITIES`). `search` filtrerar varje träff genom `load({ ids, db, viewer })`: oregistrerade typer, arkiverade rader och sådant användaren inte får se (andras konversationer och personliga skills) tas bort. `load` utan `viewer` används av indexeraren.

## Tester
- Vitest mot riktig Postgres (`docker compose up -d postgres`, `pnpm db:migrate`), inga mockar. Varje test skapar egen org via `testContext()`. Deterministisk `fakeEmbed` i `test/fake-embed.ts`.
