# 0008 – Semantisk sökning och skills

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Användare och assistenten behöver hitta entiteter (anläggningar, rum och senare bokningar) utifrån fritext och betydelse, inte bara exakta namn. Samtidigt återanvänds AI-beteende, t.ex. hur en offert sammanställs, i många sammanhang. Ad hoc-prompter i koden blir svåra att underhålla och dela.

## Beslut
### Semantisk sökning
- pgvector i samma Postgres som övrig data.
- Hybridsökning: fulltext (FTS) kombinerat med vektorsökning.
- Allt är org-scopat.
- Generiskt gränssnitt `Embeddable` för entiteter som vill vara sökbara. Inbäddningar beräknas i ett asynkront jobb när en entitet skapas eller ändras.
- Core-operationen `search` exponeras i alla ytor (ADR 0003).
- `Venue` och `Room` är först ut.
- Inbäddningsmodell väljs i konfigurationen. Valet är ännu inte gjort (se CLAUDE.md, öppna frågor).

### Skills
- Skills följer Agent Skills-stilen: namn, beskrivning, markdown-instruktioner, tillåtna verktyg och valfria resurser.
- Tre scopes:
  - System: levereras i repot, är versionerade och seedas.
  - Organisation: skapas och används av en organisation.
  - Personlig: knuten till en användare.
- Personlig skill kan delas till organisationen. En organisation kan publicera en skill.
- Export och import av `SKILL.md`.
- Assistenten laddar skills vid behov via verktygen `list_skill` och `load_skill`.
- Skills är core-operationer (skapa, läsa, dela, importera, exportera) och `Embeddable` för sökning.
- Marknadsplats mellan organisationer skjuts upp och kräver en egen ADR.

## Konsekvenser
- Sökning och skills följer samma paritets- och scopingregler som övrig data.
- Inbäddningar kostar något vid skapande och uppdatering. Jobbet måste vara idempotent och tåla fel.
- Hybridsökning kräver att vi testar relevans på riktiga exempel, inte bara att kod fungerar.
- System-skills versioneras i repot. Ändringar i dem är kodändringar och granskas som sådana.
- Import av skills från externa filer är en säkerhetsrisk. Innehållet behandlas som data och verktygsrättigheter begränsas av skillens `allowed tools`.

## Tillägg 2026-10-13 – implementering av AI-datalagret
- SYSTEM-skills lagras med `organizationId = null`. Den org-scopade klienten låter alla organisationer läsa dem men aldrig skriva dem. Endast seedern (`seedSystemSkills`) skriver dem, med den oscopade klienten. CHECK-villkor i databasen binder scope till org och ägare.
- Personlig skill delas genom att kopieras till organisationen som utkast (`skill.share`, kräver admin). Originalet ligger kvar. En medlem som vill dela behöver en admin (eller export och import).
- Verktygen heter `skill_list` och `skill_get` i MCP (operationsnamn med `_`). `list_skill` och `load_skill` i beslutet ovan blir alias eller wrappers i `packages/ai`.
- Sök filtrerar träffar per användare: personliga skills och konversationer syns bara för ägaren. SYSTEM-skills indexeras en gång globalt och ingår i alla organisationers sök.
- Konversationer (ADR 0007) är privata för ägaren. Org-admin får läsa, men inte skriva, för tillsyn.

## Tillägg 2026-10-14
- `Room` ersätts av `Item` med beteendet `BOOKABLE` (ADR 0015). `Venue` och `Item` är först ut som sökbara entiteter.
