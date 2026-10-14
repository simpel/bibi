# 0019 – Demodata via core-operationer

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Vi behöver realistisk data för utveckling, demo och e2e-tester.
- Data som skrivs direkt med Prisma kan hamna i lägen som appen aldrig kan nå, och den hoppar över validering och audit.
- Den konfigurerbara domänen (ADR 0015) syns bara om demot visar minst två organisationer som är uppsatta olika.

## Beslut
- `pnpm --filter @okazi/core seed:demo` skapar två fiktiva organisationer:
  - **Lindholmen Upplevelsecenter**: konferens, utställning och restaurang, inspirerad av referenskunden.
  - **Vingaleden Skärgårdsturer**: båtturer utan mat.
- Innehållet specificeras i `docs/demo-seed.md`. Den filen är källan, och datafilerna i koden följer den.
- Alla skrivningar går via `execute` med core-operationer, även konfiguration och statusövergångar. Aktören är `SYSTEM`. Varje organisation sätter alltså upp sig själv på samma sätt som en riktig kund skulle göra.
- Skriptet är idempotent per org-slug. En ny körning tar bort och återskapar bara demoorganisationerna. Det vägrar köra i produktion.
- Alla datum räknas relativt dagens datum, så datat inte blir inaktuellt.
- Seeden växer med varje del som byggs:
  1. Egna roller (ADR 0014)
  2. Konfigurerbar domän: typer, fält, listor, uppställningar och beteenden, inkl. migrering av `Room` (ADR 0015)
  3. Artiklar och sammansättning: katalog och paket
  4. Kunder, prislistor och säljflöde (ADR 0016, 0017)
  5. Bokningar, egna statusar, program och behov
  6. Blad med matchning och blockering
  7. Serier (ADR 0017)
  8. Export (ADR 0018)
- Kontrollerna i `docs/demo-seed.md` körs efter seeden i CI. Seeden fungerar på så sätt som ett integrationstest av hela flödet.

## Konsekvenser
- Seeden kan bara skapa sådant som operationerna stöder. Saknas en operation blir det synligt direkt.
- Samma organisationer används av Playwright (`apps/web`) i stället för egna fixturer.
- När domänen ändras måste `docs/demo-seed.md` uppdateras i samma ändring.
