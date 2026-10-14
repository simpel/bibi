---
name: new-entity
description: Add a new entity to Okazi end-to-end (Prisma, core operations, GraphQL, REST, MCP, web, generative UI, i18n, domain model). Use when a new domain entity or feature folder is to be created.
---

# New entity

Follow the order. Core first, adapters in the same change (ADR 0003).

1. **Generate the skeleton:** `pnpm gen entity <PascalName>` creates `schema.ts`, `operations.ts`, `embeddable.ts`, `graphql.ts`, `rest.ts`, `mcp.ts` and `ui/README.md`. Never overwrites existing files. Replace all `TODO`s.
2. **Prisma** (`packages/db/prisma/schema/`): `id` cuid2, `organizationId`, `status` (soft delete), `createdAt`, `updatedAt`, `createdBy` (ADR 0006). Add the model to `ORG_SCOPED_MODELS`. Run `pnpm db:generate` and `pnpm --filter @okazi/db migrate:dev`.
3. **Core:** export from `packages/core/src/index.ts`, add the operations to `core-operations.ts`, add the schema as a line in `packages/core/src/schemas.ts` (client-safe).
4. **Adapters:** `packages/graphql/src/features/<kebab>/graphql.ts`, `packages/api/src/features/<kebab>/rest.ts`, `apps/mcp/src/features/<kebab>/mcp.ts`. Follow `setup` (simple) or `item` (with controls) as the template.
5. **Web:** `apps/web/src/features/<kebab>/{actions.ts,ui/}` (copy `venue` or `item`), a line in `web-surfaces.ts`, a route under `src/app/[locale]/(app)`.
6. **Generative UI:** component in `@okazi/ui` plus wire schema and a line in `packages/ai/src/ui-contract/tool-ui-registry.ts` (or `GENERIC_UI_TOOLS`).
7. **i18n:** keys in `sv.json` and `en.json` (see skill `i18n-strings`).
8. **Docs:** update `docs/domain-model.md` and `docs/artifacts/domain-model.html` together.
9. **Verify:** `pnpm lint && pnpm check:structure && pnpm typecheck && pnpm test`. The parity test in `apps/mcp/test/parity*.ts` must be green.

Operation details are in skill `new-core-operation`.
