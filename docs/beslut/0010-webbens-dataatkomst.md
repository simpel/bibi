# 0010 – Webbens dataåtkomst

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
ADR 0003 säger "läsningar via GraphQL". Webbappen (`apps/web`) är Next.js med server components och server actions. Den körs i samma process som GraphQL- och REST-handlarna och har redan en inloggad session. Om webben läste via GraphQL över HTTP mot sig själv skulle den behöva vidarebefordra cookies, hantera ett extra nätverkshopp och generera typer för frågorna.

## Beslut
- Webben läser och skriver genom ett enda lager, `apps/web/src/server/run-operation.ts`. Det löser anroparen med `resolveExecuteContext({ headers })` (samma resolver som GraphQL, REST och MCP) och kör core `execute` med indexeringshooken. Server components anropar det för läsningar, server actions för kommandon.
- Webben bygger aldrig en egen `ExecuteContext` och importerar aldrig `@okazi/db`.
- GraphQL (`/api/graphql`) och REST (`/api/v1`) finns kvar för externa anropare, MCP:s generiska läsverktyg och integrationer. Paritetsprincipen i ADR 0003 gäller oförändrad, eftersom webben använder exakt samma operationer, behörighet och audit.
- Varje core-operation ska ha en webbyta eller ett undantag med skäl. Det styrs av `apps/web/src/features/web-surfaces.ts` och ett test.
- AI-assistenten går fortfarande via MCP (ADR 0007), inte via det här lagret.

## Konsekvenser
- Färre hopp och inga cookie-vidarebefordringar. Typerna kommer direkt från operationernas Zod-scheman.
- Webbens läsningar är begränsade till vad operationerna returnerar. Grafkanter (t.ex. `Venue.rooms`) ersätts av separata operationsanrop (`room.list`). Behövs fria grafläsningar i webben kan ett GraphQL-läge läggas till senare utan att ändra operationerna.
- Klientkomponenter får inte importera `@okazi/core` (drar in Prisma). Formulär och klientsäkra delar hämtar Zod-scheman från `@okazi/core/schemas` (se tillägget nedan).

## Tillägg 2026-10-13 – AI-fasen
- Sökvägsaliaset `@core-schema/*` är borttaget. `@okazi/core/schemas` (`packages/core/src/schemas.ts`) är ett klientsäkert underpaket som bara återexporterar feature-ernas `schema.ts` (Zod, inga Prisma- eller fs-importer). `@okazi/ai/ui` härleder sina wire-scheman ur samma fil, så core-fält följer med utan handkopierade speglingar. Att ingen Prisma hamnar i klientbundeln kontrolleras med `next build` och en sökning i `.next/static`.
- Assistentens väg är en annan än webbens: `/api/chat` och `/api/assistant/approval` (`@okazi/ai`) ansluter som användaren till `apps/mcp` med förstapartstoken (`getFirstPartyAccessToken`, klient `assistant`) och kör inte `runOperation`. Webben använder fortfarande `runOperation` för konversationshistoriken (lista, öppna, byt namn, arkivera) och för Färdigheter. Efter ett godkänt förslag anropar kortet `router.refresh()` så att serverkomponenterna läser om data.
- Att `UI_EXEMPT` är tom betyder att alla operationer har en webbyta. Operationer vars UI sitter i skalet (assistentpanelen) listas med `route: "*"` och den komponentfil som ger UI:t.

## Tillägg 2026-10-14 – konfigurerbar domän
- `Room` och `room.*` ersätts av `Item` och `item.*` (ADR 0021). Exemplet ovan blir `item.list` filtrerat på anläggning.
