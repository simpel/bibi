# @okazi/graphql – kontext för Claude

GraphQL-adaptern (Pothos + GraphQL Yoga). Tunn: all logik och behörighet ligger i `@okazi/core` (ADR 0003).

## Paritetsmekanismen
- Mutationer och primära läsningar skapas med `mutationFromOperation({ operation, type, name? })` / `fieldFromOperation(...)`. De härleder argument/input och beskrivning från operationens Zod-schema och kör alltid `execute` med requestens `ExecuteContext` (`schema/run-operation.ts`). Ny operation ≈ 1 rad.
- Objekttyper härleds med `objectFromSchema({ name, schema, omit })`. Listor använder `pageType` (`{ items, nextCursor }` = core `paginate`).
- Grafkanter (`Venue.items`, `Item.venue`, `Item.entityType`, `ItemSetup.setup`, `FieldDefinition.vocabulary`, `SearchHit.entity`) läser via `ctx.core.db` (org-scopad) efter `requirePermission`. Rå `getDb()` används aldrig.
- Entiteter med per-användarsynlighet (Conversation, Message, Skill) läses **endast via operationer**: `Conversation.messages` kör `message.list`, och `SearchEntity` laddar konversationer/skills via `conversation.get`/`skill.get` (fel → null). Gå aldrig direkt mot `ctx.core.db` för dem.
- `Message.parts`/`metadata`, `Skill.resources` och `Item.fields` är `JSON`. Nästlade listor som ska kunna väljas ur får egna typer och kanter som lyfter DTO:ns array: `EntityType.fields`, `Vocabulary.values`, `Item.setups`. `Skill.organizationId` exponeras (null = SYSTEM).
- `listGraphqlOperationNames()` ger operationerna som exponerats (paritetstestet jämför mot `listOperations()`). `printSchemaSdl()` och `schema` är till för MCP.
- Enum/okända Zod-typer blir `String`/`JSON`; nästlade objekt blir `JSON`. Skriv en egen typ vid behov.

## Handler
- `createGraphqlHandler({ resolveContext, embed, development? }): (Request) => Promise<Response>`. `resolveContext({ headers })` injiceras (riktig kommer från `@okazi/auth`); `Err` → HTTP-status från `AppError` (401 vid UNAUTHENTICATED).
- Produktion (standard): GraphiQL och introspektion av, maskerade fel. `development: true` släpper på.
- Gränser: djup 10 (`limits/depth-limit.ts`), kostnad 25 000 (`limits/cost-limit.ts`, listor multipliceras med `limit`). Egna regler, inte armor-paketen: de kastar i stället för att rapportera och Yoga maskerar dem.
- Fel: `toGraphqlError` använder core `toGraphqlExtensions` (`extensions.code/httpStatus/issues`).

## Fallgropar
- `graphql` finns som både CJS och ESM; blandade kopior bryter `instanceof GraphQLError`. Vitest inlinar därför graphql/pothos/envelop (`vitest.config.ts`). Gör likadant i andra testmiljöer.
- Pothos prisma-plugin används inte: klienten är en `$extends`-klient (`scopedDb`) och Prisma 7-genererad. Typerna är handskrivna/Zod-härledda.
- Relationsläsningar har ingen dataloader ännu (N+1 per förälder, begränsat av djup/kostnad).

## Ny entitet
`pnpm gen entity` skapar `src/features/<entitet>/graphql.ts`; importera filen i `schema/schema.ts`.

## Tester
Vitest mot riktig Postgres (som core). `test/helpers.ts`: `createClient({ context? })` bygger en handler med fast kontext.
