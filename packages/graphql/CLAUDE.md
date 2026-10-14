# @okazi/graphql – context for Claude

The GraphQL adapter (Pothos + GraphQL Yoga). Thin: all logic and permissions live in `@okazi/core` (ADR 0003).

## The parity mechanism
- Mutations and primary reads are created with `mutationFromOperation({ operation, type, name? })` / `fieldFromOperation(...)`. They derive arguments/input and description from the operation's Zod schema and always run `execute` with the request's `ExecuteContext` (`schema/run-operation.ts`). A new operation ≈ 1 line.
- Object types are derived with `objectFromSchema({ name, schema, omit })`. Lists use `pageType` (`{ items, nextCursor }` = core `paginate`).
- Graph edges (`Venue.items`, `Item.venue`, `Item.entityType`, `ItemSetup.setup`, `FieldDefinition.vocabulary`, `SearchHit.entity`) read via `ctx.core.db` (org-scoped) after `requirePermission`. Raw `getDb()` is never used.
- Entities with per-user visibility (Conversation, Message, Skill) are read **only via operations**: `Conversation.messages` runs `message.list`, and `SearchEntity` loads conversations/skills via `conversation.get`/`skill.get` (error → null). Never go directly against `ctx.core.db` for them.
- `Message.parts`/`metadata`, `Skill.resources` and `Item.fields` are `JSON`. Nested lists that must be selectable get their own types and edges that lift the DTO's array: `EntityType.fields`, `Vocabulary.values`, `Item.setups`. `Skill.organizationId` is exposed (null = SYSTEM).
- `listGraphqlOperationNames()` gives the operations that are exposed (the parity test compares against `listOperations()`). `printSchemaSdl()` and `schema` are for MCP.
- Enum/unknown Zod types become `String`/`JSON`; nested objects become `JSON`. Write a custom type when needed.

## Handler
- `createGraphqlHandler({ resolveContext, embed, development? }): (Request) => Promise<Response>`. `resolveContext({ headers })` is injected (the real one comes from `@okazi/auth`); `Err` → HTTP status from `AppError` (401 on UNAUTHENTICATED).
- Production (default): GraphiQL and introspection off, masked errors. `development: true` turns them on.
- Limits: depth 10 (`limits/depth-limit.ts`), cost 25,000 (`limits/cost-limit.ts`, lists are multiplied by `limit`). Custom rules, not the armor packages: they throw instead of reporting and Yoga masks them.
- Errors: `toGraphqlError` uses core `toGraphqlExtensions` (`extensions.code/httpStatus/issues`).

## Pitfalls
- `graphql` exists as both CJS and ESM; mixed copies break `instanceof GraphQLError`. Vitest therefore inlines graphql/pothos/envelop (`vitest.config.ts`). Do the same in other test environments.
- The Pothos prisma plugin is not used: the client is an `$extends` client (`scopedDb`) and Prisma 7-generated. The types are hand-written/Zod-derived.
- Relation reads have no dataloader yet (N+1 per parent, bounded by depth/cost).

## New entity
`pnpm gen entity` creates `src/features/<entity>/graphql.ts`; import the file in `schema/schema.ts`.

## Tests
Vitest against a real Postgres (like core). `test/helpers.ts`: `createClient({ context? })` builds a handler with a fixed context.
