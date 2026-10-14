# {{Pascal}} – UI

Placeholder skapad av `pnpm gen entity {{Pascal}}`. UI för {{Pascal}} läggs i den här mappen (`apps/web/src/features/{{kebab}}/ui/`).

- Bygg med `@okazi/ui` (cva och tokens). Inga råa färger och inga egna primitiver i appen.
- All text går via next-intl (sv och en, båda filerna i `packages/i18n/messages`).
- Data går via ETT lager: `apps/web/src/server/run-operation.ts` (server components) och server actions i `apps/web/src/features/{{kebab}}/actions.ts` som anropar `runOperation({ operation, input })` och `toActionResult`. Aldrig `@okazi/db` eller egen `ExecuteContext` (ADR 0010).
- Mönster att kopiera: `features/venue/ui/` (lista med cursor-paginering, formulär med react-hook-form + core-schemat, dialog, arkivera med bekräftelse) och `features/room/ui/` (underlista på detaljsidan).
- Klientkomponenter får inte importera `@okazi/core` (värden). Schemat nås via `@core-schema/{{kebab}}` (lägg alias i `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`).
- Registrera operationerna i `apps/web/src/features/web-surfaces.ts` (`WEB_SURFACES`) eller lista dem i `UI_EXEMPT` med skäl. Testet `web-surfaces.test.ts` och paritetstestet i `apps/mcp` kräver det.
- Lägg en sida under `apps/web/src/app/[locale]/(app)/<route>/page.tsx` och en post i `components/shell/nav-items.ts`.
- Resultat i assistenten visas med en generative UI-komponent. Registrera resultattypen `{{kebab}}` i `packages/ai` (ADR 0007).
