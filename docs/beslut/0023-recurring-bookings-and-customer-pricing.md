# 0023 – Återkommande bokningar och kundpriser

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Företagskunder bokar ofta samma upplägg regelbundet, t.ex. ett mötesrum första tisdagen varje månad, till ett avtalat lägre pris.
- Domänmodellen har Prislista med kundspecifik rabatt, men inget sätt att uttrycka serier.

## Beslut
- `BookingSeries` innehåller kund, mall (artiklar inkl. rum, möblering och tider) och återkommande regel. Regeln är en delmängd av RFC 5545 RRULE: `FREQ=WEEKLY|MONTHLY`, `INTERVAL`, `BYDAY` (inkl. "1TU"), `BYMONTHDAY`, `COUNT` eller `UNTIL`. Den valideras med Zod.
- Varje tillfälle är en vanlig `Booking` med `seriesId` och `occurrenceIndex`, så statusar, ansvariga och beläggning fungerar som för andra bokningar.
- Tillfällen skapas när serien skapas, högst 12 månader eller 52 tillfällen fram. Krockar avbryter inte serien. Krockande tillfällen markeras och returneras så att användaren kan välja rum eller tid för just dem.
- Ändringar görs antingen för "bara detta tillfälle" eller för "detta och följande". Att avboka en serie avbokar alla kommande tillfällen.
- Kundpris: `PriceList` med `customerId`, giltighet och antingen generell rabatt (%) eller pris per artikel. Serien och kunden pekar på prislistan.
- Orderrader kopierar priset när de skapas. En ändrad prislista påverkar bara nya rader.
- En offert kan gälla en hel serie. Raderna visas per tillfälle och summeras.

## Konsekvenser
- Nya entiteter: `BookingSeries`, `PriceList` och `PriceListItem`.
- Kalendervyer måste visa vilka bokningar som hör till en serie.
- Generering längre fram än 12 månader görs av schemaläggaren i ett nattligt jobb (ADR 0027).
