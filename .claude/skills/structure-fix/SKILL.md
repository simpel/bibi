---
name: structure-fix
description: Åtgärda brott mot `pnpm check:structure` (150 rader/fil, 40 rader/funktion, named exports, barrel-filer, ett objekt som parameter, feature-filer). Använd när strukturkontrollen eller CI fallerar.
---

# Strukturåtgärder

Regler: `docs/beslut/0009-sprak-i-kod-och-ui.md`. Kontroll: `tools/check-structure.mjs` och `tools/lib/`.

1. Kör `pnpm check:structure` och läs utdatan per fil.
2. Åtgärda per regel:
   - **Fil > 150 rader:** dela efter idé (en idé per fil), t.ex. schema, formulärhook, tabell, dialog som egna filer. Se `apps/web/src/features/room/ui/` som mönster.
   - **Funktion > 40 rader:** extrahera hjälpfunktioner i samma eller en ny fil. Extrahera gemensam kod vid andra dubbletten.
   - **Default export:** byt till named. Tillåtet endast för Next `page`/`layout`/`route`, `*.config.ts` och `*.stories.tsx`.
   - **Barrel-fil:** ta bort. Endast `packages/*/src/index.ts` är tillåten.
   - **Positionsparametrar:** ett typat objekt, `fn({ a, b }: FnInput)`. Undantag: `cn(...inputs)`.
   - **Feature-fil saknas:** skapa `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts` eller `mcp.ts` (se skill `new-entity`).
3. Kör `pnpm lint` (Biome) och `pnpm typecheck`. Ändra inte reglerna i `tools/` för att få grönt.
