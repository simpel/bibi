---
name: new-entity
description: Add a new entity to Okazi end-to-end (Prisma, core operations, GraphQL, REST, MCP, web, generative UI, i18n, domain model). Use when a new domain entity or feature folder is to be created.
---

# New entity

Follow the order. Core first, adapters in the same change (ADR 0003).

1. **Generate the skeleton:** `pnpm gen entity <PascalName>` creates `schema.ts`, `operations.ts`, `embeddable.ts`, `graphql.ts`, `rest.ts`, `mcp.ts`, `ui/README.md`, the Prisma model (`packages/db/prisma/schema/<kebab>.prisma`) and the web `actions.ts`. Never overwrites existing files. It prints a checklist of the hand-edited files (scoped models, `WEB_SURFACES`, parity `ENTITIES`, GraphQL schema import, i18n, domain model); work through it. Replace all `TODO`s. Naming matches `setup`: `<Pascal>Schema`, `<Pascal>CreateInputSchema`, `<Pascal>Dto`, camelCase operation names (`<camel>.create`), permissions `<feature>:read|write|delete` (add the feature to `FEATURE_SPECS` and decide the presets in core `permissions/presets.ts`, or reuse the owning feature; add the entity type to `ENTITY_FEATURE`, ADR 0050). Handlers are `todo` placeholders returning a `Result`; the generator test (`packages/core/test/entity-generator.test.ts`) keeps the skeleton typechecking.
2. **Prisma** (`packages/db/prisma/schema/`): classify every column as owned, derived, projection or snapshot (ADR 0051) and put it in the model comment; a projection also needs a reconciliation check (see skill `new-feature`). `id` cuid2, `organizationId`, `status` (soft delete), `createdAt`, `updatedAt`, `createdBy` (ADR 0006). Add the model to `ORG_SCOPED_MODELS` and `SOFT_DELETE_DEFAULTS`. Run `pnpm db:generate` and `pnpm --filter @okazi/db migrate:dev`.
3. **Core:** export from `packages/core/src/index.ts`, add the operations to `core-operations.ts`, add the schema as a line in `packages/core/src/schemas.ts` (client-safe).
4. **Adapters:** `packages/graphql/src/features/<kebab>/graphql.ts`, `packages/api/src/features/<kebab>/rest.ts`, `apps/mcp/src/features/<kebab>/mcp.ts`. Follow `setup` (simple) or `item` (with controls) as the template.
5. **Web:** `apps/web/src/features/<kebab>/{actions.ts,ui/}` (`actions.ts` is generated, extend it; copy `venue` or `item` for ui), a line in `web-surfaces.ts`, a route under `src/app/[locale]/(app)`.
6. **Generative UI:** component in `@okazi/ui` plus wire schema and a line in `packages/ai/src/ui-contract/tool-ui-registry.ts` (or `GENERIC_UI_TOOLS`).
7. **i18n:** keys in `sv.json` and `en.json` (see skill `i18n-strings`).
8. **Docs:** update `docs/domain-model.md` (with the entity's "Ownership" line, ADR 0051) and `docs/artifacts/domain-model.html` together.
9. **Isolation test:** add a step to `apps/mcp/test/isolation-<area>.test.ts` for every new operation (organization B gets `NOT_FOUND` with A's ids). `isolation-coverage.test.ts` fails without it. Other gates: skill `new-feature`.
10. **Verify:** `pnpm lint && pnpm check:structure && pnpm typecheck && pnpm test`. The parity test in `apps/mcp/test/parity*.ts` must be green.

Operation details are in skill `new-core-operation`.
