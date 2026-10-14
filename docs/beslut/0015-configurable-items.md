# 0015 – Konfigurerbar domän

- **Datum:** 2026-10-14
- **Status:** Accepterat
- **Ersätter:** 0011

## Kontext
- Anläggningar är olika. En konferensgård har kök, allergener och möbleringar. Ett båtbolag har båtar, turer och tillgänglighetsbehov, och för ett museum är mat kanske helt irrelevant.
- Om systemet förutsätter begrepp som "rätt", "allergen" eller "köksorder" tar det två sekunder innan en kund vill ha något liknande men annorlunda.
- Systemet ska därför inte innehålla några domänord. Varje organisation sätter upp sitt eget bibliotek en gång. Koden står bara för generiskt beteende.

## Beslut

### Organisationen konfigurerar (data)
- **Typer** (`EntityType`): varje organisation definierar typer för sina grundentiteter, dvs. artikel (`Item`), kund, kontaktperson, förfrågan och bokning. Exempel: Konferensrum, Rätt, Båt och Paket för artiklar, Företag och Myndighet för kunder, Konferens och Event för bokningar.
- **Fält** (`FieldDefinition`) per typ: text, tal, ja/nej, datum, val, flerval ur en lista, eller länk till en annan typ. Värdena lagras som JSON på raden och valideras av ett Zod-schema som byggs från definitionerna.
- **Listor** (`Vocabulary` + `VocabularyValue`): organisationens egna ordlistor, t.ex. "Allergener", "Kost", "Tillgänglighet" eller "Dresscode". Flervalsfält och behov pekar på en lista.
- **Behov** (`Requirement`): antal på en bokning mot ett värde i en lista, t.ex. Gluten × 3 eller Rullstol × 2. Behovet kan gälla hela bokningen eller en programpunkt, och en rad på programpunkten ersätter bokningens antal där. Behov är också en typ med egna fält, t.ex. "Allvarlighetsgrad".
- **Blad**: organisationen definierar bladet (`SheetDefinition`), och varje bokning får versionerade blad (`Sheet`). Exempel på blad är "Köksorder" och "Bryggorder". Definitionen anger vilka artikeltyper och fält som ingår, vilka listor vars behov tas med och vilken roll det går till. Bladen är versionerade med ändringsmarkering (★).
- **Uppställningar** (`Setup`): organisationens egna uppställningar med ställtid, t.ex. Bio, U-bord och Mingel.
- Statusar, roller och övergångar konfigureras på samma sätt (ADR 0014, 0016).

### Koden står för (fast beteende utan domänord)
Typer för `Item` slår på beteenden:

| Beteende | Systemet gör |
|---|---|
| `PRICED` | Pris, prisenhet (`PER_PERSON`, `PER_UNIT`, `PER_HOUR`, `FLAT`), moms och orderrader |
| `COMPOSABLE` | Innehåller andra artiklar med antal, `offsetMinutes` och `durationMinutes` |
| `CHOICES` | Valgrupper bland delarna (`minPick`, `maxPick`). Kräver `COMPOSABLE`. |
| `BOOKABLE` | Beläggning i tid och krockskydd. Har standardlängd. |
| `SETUPS` | Kapacitet per uppställning och ställtid. Kräver `BOOKABLE`. |

- **Matchning:** ett behov på en bokning jämförs med artiklarna på bokningen som är taggade med samma listvärde. En träff på en obligatorisk del utan alternativ flaggas och blockerar bladet. Det är den gamla allergikontrollen i generell form.
- **Ärvda taggar:** en sammansatt artikel ärver delarnas listvärden. Obligatoriska delar ger "innehåller", valbara delar ger "kan innehålla" per alternativ. `item.resolve` är den enda platsen där detta räknas fram.
- Ett beteende kan inte stängas av på en typ så länge någon artikel av typen har data för det (`CONFLICT`).

### Mallar är frivillig data
- Nya organisationer börjar tomma. Inget är förinstallerat.
- Mallar kan importeras, t.ex. listan "EU:s 14 allergener" eller startpaketet "Konferensgård". En mall är bara data som skapas via vanliga operationer och kan ändras fritt efteråt.
- AI-assistenten kan föreslå en konfiguration ("vi är en herrgård med restaurang"). Användaren godkänner som vanligt (ADR 0007).

### Sammansättning, pris och snapshot
- Grafen av `ItemComponent` är acyklisk. Core avvisar cykler och mer än 5 nivåers djup med `VALIDATION`.
- I ett paket debiteras paketets pris. Momsen fördelas på delarna i proportion till delarnas listpris.
- `customerId = null` betyder katalogartikel. `customerId` satt betyder ett kundspecifikt paket. En offert kan också sättas ihop direkt av artiklar, och "Spara som paket" skapar då en kundspecifik artikel.
- När en artikel läggs på en bokning expanderar core den till programpunkter, beläggning och orderrader. Raderna kopierar namn, pris, moms och taggar (snapshot).
- Behov kopplas aldrig till en person. Det finns inga personuppgifter om enskilda gäster.

## Konsekvenser
- `Room` migreras till `Item` av en typ med `BOOKABLE` + `SETUPS`. Rummets fält (våning, yta, takhöjd, dagsljus) blir organisationens egna fält. `room.*` ersätts av `item.*` och paritetstestet uppdateras i samma ändring. Anläggning (`Venue`) finns kvar.
- `Allergen` som globalt referensdata (ADR 0011) försvinner. EU:s 14 blir en importerbar listmall.
- Deltagare stryks ur MVP. Självregistrering med allergier per person är inte längre en differentierare.
- Operationerna är generiska (`item.*`, `entityType.*`, `fieldDefinition.*`, `vocabulary.*`, `requirement.*`, `sheet.*`, `setup.*`). GraphQL och REST exponerar fält som `fields: JSON` plus definitionerna. MCP-verktygen beskriver organisationens fält dynamiskt, så att AI:n ser "Hytter" hos båtbolaget och "Dagsljus" hos konferensgården.
- UI och AI måste läsa konfigurationen för att veta vad som gäller. Varje beteende och fälttyp får därför ett eget Zod-schema och en egen komponent i `@okazi/ui`.
- Rapporter som ska fungera i alla organisationer bygger på beteenden och faser, aldrig på typnamn.
