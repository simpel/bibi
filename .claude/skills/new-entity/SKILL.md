---
name: new-entity
description: Lägg till en ny entitet i Okazi end-to-end (Prisma, core-operationer, GraphQL, REST, MCP, webb, generative UI, i18n, domänmodell). Använd när en ny domänentitet eller feature-mapp ska skapas.
---

# Ny entitet

Följ ordningen. Core först, adaptrar i samma ändring (ADR 0003).

1. **Generera skelett:** `pnpm gen entity <PascalName>` skapar `schema.ts`, `operations.ts`, `embeddable.ts`, `graphql.ts`, `rest.ts`, `mcp.ts` och `ui/README.md`. Skriver aldrig över befintliga filer. Ersätt alla `TODO`.
2. **Prisma** (`packages/db/prisma/schema/`): `id` cuid2, `organizationId`, `status` (mjuk radering), `createdAt`, `updatedAt`, `createdBy` (ADR 0006). Lägg modellen i `ORG_SCOPED_MODELS`. Kör `pnpm db:generate` och `pnpm --filter @okazi/db migrate:dev`.
3. **Core:** exportera från `packages/core/src/index.ts`, lägg operationerna i `core-operations.ts`, lägg schemat som en rad i `packages/core/src/schemas.ts` (klientsäkert).
4. **Adaptrar:** `packages/graphql/src/features/<kebab>/graphql.ts`, `packages/api/src/features/<kebab>/rest.ts`, `apps/mcp/src/features/<kebab>/mcp.ts`. Följ `setup` (enkel) eller `item` (med kontroller) som mall.
5. **Webb:** `apps/web/src/features/<kebab>/{actions.ts,ui/}` (kopiera `venue` eller `item`), rad i `web-surfaces.ts`, rutt under `src/app/[locale]/(app)`.
6. **Generative UI:** komponent i `@okazi/ui` plus wire-schema och rad i `packages/ai/src/ui-contract/tool-ui-registry.ts` (eller `GENERIC_UI_TOOLS`).
7. **i18n:** nycklar i `sv.json` och `en.json` (se skill `i18n-strings`).
8. **Docs:** uppdatera `docs/domanmodell.md` och `docs/artefakter/domanmodell.html` tillsammans.
9. **Verifiera:** `pnpm lint && pnpm check:structure && pnpm typecheck && pnpm test`. Paritetstestet i `apps/mcp/test/parity*.ts` måste vara grönt.

Operationsdetaljer finns i skill `new-core-operation`.
