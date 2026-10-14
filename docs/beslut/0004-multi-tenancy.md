# 0004 – Multi-tenancy med Better Auth organization-plugin

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Varje venue-kund är en egen organisation med egna användare, anläggningar, bokningar och kunddata. Data får aldrig läcka mellan organisationer. Samma regel gäller för webb, REST, GraphQL och MCP. En användare kan tillhöra flera organisationer.

## Beslut
- Organisation = venue-kund. Better Auths organization-plugin hanterar medlemskap, roller och inbjudningar.
- Aktiv organisation ingår i sessionen. Varje yta (web, REST, GraphQL, MCP) löser den via samma sessions- och behörighetsupplösning i `packages/auth`.
- Alla rader i databasen har `organizationId`. Se ADR 0006.
- Prisma-klienten är org-scopad via en extension. Frågor utan org-kontext avvisas.
- Varje core-operation tar emot en kontext med `organizationId` och `actorId`. Operationen måste använda kontexten, inte en klient-skickad organisation.
- Korsorganisatorisk åtkomst är avstängd i MVP. Partner (extern restaurangoperatör) får i framtiden egen åtkomst via köksorder, inte via medlemskap.
- Tester verifierar att åtkomst till annan organisations data nekas i alla ytor.

## Konsekvenser
- Tenancy-skyddet är ett kritiskt område. Ändringar i auth, Prisma-extensionen eller kontextupplösningen granskas av Opus-nivå enligt CLAUDE.md.
- Användare med flera organisationer behöver org-växling i UI och i API-anrop.
- Better Auth-organization-plugin styr datamodellen för organisationer och medlemskap. Vi anpassar inte den utan ny ADR.
- Partner-åtkomst över bolagsgräns (köksorder) kräver en separat modell som ska beslutas senare.

## Tillägg 2026-10-14
- Partneråtkomst över bolagsgräns är inte längre planerad. Raden om partner i Beslut och den sista punkten i Konsekvenser gäller inte längre (ADR 0024). Blad går till en roll i den egna organisationen, och överlämning till någon utanför sker genom export.
- Roller är organisationens egna (ADR 0020). `packages/auth` löser medlemmens roller till behörigheter per anrop. Korsorganisatorisk åtkomst är fortsatt avstängd.
