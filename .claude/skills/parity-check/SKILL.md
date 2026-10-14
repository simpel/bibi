---
name: parity-check
description: Felsök ett rött paritetstest eller verifiera 1:1-paritet mellan web, GraphQL, REST och MCP. Använd när `pnpm test` fallerar i paritet eller efter att en operation lagts till.
---

# Paritetskontroll

1. Kör `pnpm --filter @okazi/mcp test -- parity` (testfilerna: `apps/mcp/test/parity.test.ts`, `parity-graphql.ts`, `parity-rest.ts`, `parity-entities.ts`) och `pnpm --filter @okazi/web test -- web-surfaces`, `pnpm --filter @okazi/api test -- parity`, `pnpm --filter @okazi/ai test -- ui-contract`.
2. Mappa felet till saknad yta:
   - Saknas i REST: `packages/api/src/features/<entitet>/rest.ts`.
   - Saknas i GraphQL: `packages/graphql/src/features/<entitet>/graphql.ts` (`markExposed` anropas av `*FromOperation`).
   - Saknas i MCP: `apps/mcp/src/features/<entitet>/mcp.ts`.
   - Saknas i webben: rad i `apps/web/src/features/web-surfaces.ts`, eller `UI_EXEMPT` med skäl.
   - Saknas generative UI: rad i `packages/ai/src/ui-contract/tool-ui-registry.ts`, eller `GENERIC_UI_TOOLS`.
3. Åtgärda genom att lägga till ytan. Ta aldrig bort en operation eller lägg undantag bara för att få grönt.
4. Kör `pnpm check:structure` (kräver `graphql.ts`, `rest.ts`, `mcp.ts` per kärnentitet) och `pnpm test` igen.
