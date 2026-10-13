# 0006 – Databaskonventioner

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Okazi har många entiteter som kopplas till varandra över organisations- och bolagsgränser. Data ska kunna spåras, återställas och granskas. Id:n ska fungera i URL:er, i externa system och i AI-verktyg utan att avslöja antal eller ordning.

## Beslut
- Id:n är cuid2-strängar.
- Mjuk radering: entiteter tas bort genom att sätta `status` (t.ex. `ARCHIVED`), inte med `DELETE`. Hård radering sker bara i migrationer och av drift.
- Varje tabell har `createdAt`, `updatedAt` och `createdBy`.
- Tabellen `AuditLog` loggar varje mutation: vem (`actor` = `user` eller `ai`), vad (operation), vilken entitet, före- och efterbild samt konversations-id när mutationen kommer från assistenten.
- Varje rad har `organizationId`. Undantag är globala system-tabeller, t.ex. användare och system-skills, som listas uttryckligen.
- Tabeller och kolumner följer Prisma-schemat i `packages/db`. Migrationer körs med `pnpm db:migrate`.

## Konsekvenser
- Mjuk radering gör att alla listor och sökningar måste filtrera på `status`. Det sköts i core och i den org-scopade klienten, inte i varje query.
- `AuditLog` växer snabbt. Retention och arkivering behöver beslutas senare.
- cuid2 är ett strängformat, så index blir större än för heltal. Vi accepterar det för att id:n ska vara ogenomskinliga.
- Den som skriver en ny mutation kan inte glömma audit, eftersom audit-hooken ligger i core.
