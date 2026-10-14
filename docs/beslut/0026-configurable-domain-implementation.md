# 0026 – Konfigurerbar domän: val i implementationen

- **Datum:** 2026-10-14
- **Status:** Accepterat
- **Bygger på:** 0021, 0025 (del 2)

## Kontext
- ADR 0021 beslutar att typer, fält, listor och uppställningar är data, och att koden bara äger beteenden.
- Del 2 av ADR 0025 bygger detta och ersätter `Room` med `Item`. Under arbetet kom några frågor upp som 0021 inte svarar på.

## Beslut

### Fältvärden
- Värdena lagras som JSON på raden (`Item.fields`) under fältets **nyckel** (`key`).
  - Nyckeln genereras från namnet ("Yta m²" → `yta_m2`) eller anges när fältet skapas.
  - Nyckeln ändras aldrig och är unik per typ, även bland arkiverade fält.
  - Ett namnbyte flyttar alltså inga värden, och REST, GraphQL och AI ser läsbara nycklar.
- `buildFieldsSchema({ specs })` (core, klientsäker) bygger ett strikt Zod-schema från typens fält. Webben validerar med samma schema som servern.
- Val ur en lista lagras som listvärdets id, så att ett namnbyte på värdet inte bryter något.
- `item.update` slår ihop `fields` per nyckel, och `null` tar bort ett värde.
- Fälttypen "länk till annan typ" byggs när kunder och bokningar finns.

### Val och flerval
- Ett val- eller flervalsfält har **antingen** en lista (`vocabularyId`) **eller** egna alternativ (`options`), aldrig båda.
- Egna alternativ passar för enstaka fält som "Serveringsform".
- Bara värden ur listor räknas som taggar i matchningen (del 6). Taggar är inga egna rader, utan värdena i fält som väljer ur en lista.

### "Data finns → CONFLICT"
Principen i 0021 gäller allt som skulle göra befintliga värden ogiltiga:
- att stänga av ett beteende som en aktiv artikel har data för
- att byta fälttyp eller lista
- att ta bort ett alternativ som används
- att göra ett fält obligatoriskt när artiklar saknar värde
- att arkivera ett fält som har värden, ett listvärde som en artikel bär, en lista som ett fält använder, en uppställning med kapacitet eller en typ med aktiva artiklar

Kontrollen räknas i minnet per typ. Katalogerna har hundratals rader, så det räcker tills vidare.

### Beteenden i kolumner
- Beteendedata ligger i vanliga kolumner på `Item`, och kolumnerna har bara värden om typen har beteendet (annars `VALIDATION`):
  - `PRICED`: `priceMinor` (öre), `priceUnit` och `vatRatePercent`
  - `BOOKABLE`: `defaultDurationMinutes`
  - `SETUPS`: `ItemSetup`-rader
- Kapaciteter ersätts som en mängd via `item.create` och `item.update` (`setups`).
- `COMPOSABLE` och `CHOICES` kan slås på redan nu, men delar och valgrupper kommer i del 3.

### Behörigheter
- Två nya resurser:
  - `item` ersätter `room`.
  - `configuration` täcker typer, fält, listor och uppställningar.
- I mallen "Konferensgård" har Admin `admin` på båda och övriga roller `read`. UI och AI måste läsa konfigurationen för att förstå artiklarna.

### MCP
- `item_list`, `item_get`, `item_create` och `item_update` får en beskrivning per anrop med organisationens typer, fält och tillåtna värden.
- Beskrivningen läses via `entityType.list` som anroparen. Utan `configuration:read` används den statiska beskrivningen.

## Konsekvenser
- `room.*`, tabellen `Room` och resursen `room` är borta. Ingen datamigrering behövs, eftersom det inte finns någon produktionsdata.
- Ett beteende kan bara stängas av efter att datan har tagits bort. Det är avsiktligt hellre än tyst dataförlust.
- Den som vill byta en fälttyp skapar ett nytt fält, flyttar värdena och arkiverar det gamla.
- Requirement-typer kopplas till listor i del 5 (`requirement.*`).
