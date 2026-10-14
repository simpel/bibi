---
name: new-core-operation
description: Lägg till eller ändra en core-operation (query/command) och exponera den på alla ytor. Använd vid ny förmåga på en befintlig entitet, t.ex. ett nytt kommando.
---

# Ny core-operation

Mall: `packages/core/src/features/setup/operations.ts` (enkel) eller `features/item/` (uppdelad i read/write/lifecycle).

1. **Schema** i `features/<entitet>/schema.ts`: Zod för in- och utdata. Gör input till ett objekt, inga positionsargument.
2. **Operation** med `defineOperation({ name, kind, description, input, output, permission, handler })`.
   - `name`: `<entitet>.<verb>` (t.ex. `item.archive`).
   - `permission`: `<resurs>:read|write|admin`.
   - `kind: "command"` kräver godkännande som standard (AI föreslår, människa bekräftar). Sätt `approval` bara om ett undantag är motiverat.
   - Handlern använder `context.db` (org-scopad), skriver aldrig `organizationId` själv i `where`, sätter `organizationId` och `createdBy` vid create, och anropar `context.recordChange({ entityId, before?, after })` för audit.
   - Fel: `err({ error: new AppError({ code, message }) })`. Aldrig `throw`.
   - Ändrar den sökbara fält: sätt `embeddable`.
3. Lägg operationen i entitetens lista och i `core-operations.ts`. Anropa via `execute`, aldrig `handler` direkt.
4. **Adaptrar i samma ändring:** `rest.ts` (`restRoute`), `graphql.ts` (`*FromOperation`), `mcp.ts`, `apps/web/src/features/web-surfaces.ts` (eller `UI_EXEMPT` med skäl) och `tool-ui-registry.ts`.
5. Tester mot riktig Postgres i `packages/core`. Kör `pnpm test`.

Ska tillståndet ändras av AI? Se `docs/beslut/0007-ai-first-ux.md`.
