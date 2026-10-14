# 0022 – Säljflöde, statusar och ansvariga

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Kärnflödet i domänmodellen är Förfrågan → Option → Offert → Bokning. Varje steg har status, men övergångarna och ansvarsfördelningen är inte beslutade.
- Varje bokning behöver en tydlig ansvarig. Statusändringar måste gå att granska och får inte ske genom fri redigering av ett statusfält.

## Beslut
- Fasta statusmaskiner för säljstegen, definierade en gång per entitet i core (`features/<entitet>/transitions.ts`):

  | Entitet | Statusar |
  |---|---|
  | Förfrågan (`Inquiry`) | `NEW → QUALIFIED → QUOTED → WON` eller `LOST` (kräver förlustorsak) |
  | Option | `ACTIVE (rang 1, 2, …) → CONVERTED`, `EXPIRED` eller `RELEASED` |
  | Offert (`Quote`) | `DRAFT → SENT → ACCEPTED`, `DECLINED` eller `EXPIRED`, versionerad |

- Säljstegens övergångar är egna kommandon, t.ex. `inquiry.qualify`, `inquiry.markLost`, `quote.send` och `quote.accept`. Status kan aldrig sättas via `update`. En otillåten övergång ger `CONFLICT`.

### Bokningsstatusar per organisation
- Varje organisation definierar sina egna bokningsstatusar (`BookingStatus`): namn, färg, ordning och en **fas**.
- Fasen är fast och styr systemets beteende. Statusarna är organisationens egna etiketter inom faserna:

  | Fas | Systemets regler |
  |---|---|
  | `TENTATIVE` | Bokningsbara artiklar är belagda. Blad (ADR 0021) kan inte skickas. |
  | `CONFIRMED` | Kräver koordinator. Blad och förskott kan skickas. |
  | `COMPLETED` | Tillåts först efter bokningens slut. Bokningen kan faktureras. |
  | `CANCELLED` | Kräver orsak. Beläggningen frigörs och avbokningsvillkoren tillämpas. |

- Tillåtna övergångar definieras av organisationen (`BookingStatusTransition`, från → till). Fasreglerna kan inte stängas av.
- Ett enda kommando ändrar status: `booking.changeStatus({ bookingId, statusId, reason? })`. Statusar hanteras med `bookingStatus.list|create|update|archive|reorder` (`bookingStatus:admin`). En status som används kan arkiveras men inte tas bort.
- En ny organisation får en status per fas så att bokningar fungerar direkt. Fler statusar och övergångar kan läggas till eller importeras som mall. Exempel, mallen "Konferensgård":
  - Preliminär (`TENTATIVE`)
  - Bekräftad (`CONFIRMED`)
  - Slutligt antal låst (`CONFIRMED`)
  - Genomförd (`COMPLETED`)
  - Avbokad (`CANCELLED`)

  Alla övergångar framåt och till Avbokad är tillåtna.
- `quote.accept` gör förfrågan `WON` och omvandlar optionerna (`CONVERTED`). Bokningen skapas med organisationens förvalda status i fasen `CONFIRMED`. En snabbokning (litet möte utan förfrågan och offert) skapas av personalen med förvald `TENTATIVE`-status. Kunden betalar via Swish- eller kortlänk eller mot faktura. Vid betalning med länk flyttas bokningen till `CONFIRMED` när betalningen är klar, och vid faktura bekräftar personalen den direkt. Kunden använder aldrig appen.
- Förfrågan och offert behåller fasta statusar, eftersom systemets logik bygger på dem. Samma mönster (egna statusar med fast fas) kan användas där senare.
- Ansvariga är medlemmar i organisationen:
  - `Inquiry.salesOwnerId` krävs från `QUALIFIED`.
  - `Quote` ärver säljaren från förfrågan.
  - `Booking.salesOwnerId` och `Booking.coordinatorId`. Koordinator krävs från `CONFIRMED`.
  - `ProgramItem.responsibleId` är valfri.
  - Byte av ansvarig görs med `*.assign` och loggas.
- Optioner står i kö per bokningsbar artikel och tid. Rangen sätts automatiskt (antal aktiva överlappande optioner + 1). När en option släpps eller förfaller flyttas de bakomliggande upp.
- Förfall: kommandot `option.expireDue` förfaller alla optioner vars datum passerat. Det körs manuellt eller av schemaläggaren var 15:e minut (ADR 0027).
- Beläggning (`Occupancy`) är en tabell med typerna `BOOKING`, `OPTION`, `SETUP`, `MAINTENANCE`, `INTERNAL`. Alla utom `OPTION` får inte överlappa på samma bokningsbara artikel (`BOOKABLE`, ADR 0021), vilket säkras med en exclusion constraint i Postgres (`btree_gist`). Ställtid läggs in som `SETUP` utifrån uppställningens ställtid (`Setup`, ADR 0021).
- Signering skjuts upp. `quote.accept` sparar `acceptedBy`, `acceptedAt` och `acceptanceMethod` (`MANUAL` nu, senare `BANKID` och `LINK`).
- Statushistorik kommer från `AuditLog`. Entiteterna har dessutom `statusChangedAt` för listor och sortering.

## Konsekvenser
- Nya entiteter: Kund, Kontaktperson, Förfrågan, Option, Offert, Orderrad, Bokning, Programpunkt, Beläggning och Behov (ADR 0021). Det är det största steget hittills och byggs i delar (se ADR 0025).
- Statusmaskinerna testas som tabeller: varje tillåten och varje otillåten övergång. Fasreglerna för bokning testas separat, så att en egendefinierad övergång aldrig kan kringgå dem.
- Rapporter och filter som ska fungera i alla organisationer grupperar på fas, inte på status.
- AI kan föreslå övergångar men inte genomföra dem utan godkännande (ADR 0007).
