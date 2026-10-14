# 0014 – Egna roller per organisation

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- I dag finns fyra fasta nivåer: `viewer < member < admin < owner` (`packages/auth/src/permissions.ts`). Core översätter dem till `read|write|admin` på alla resurser (`packages/core/src/operations/permission.ts`).
- En anläggning arbetar med funktioner, inte nivåer: säljare, koordinator, kök, ekonomi, admin. Olika anläggningar delar upp ansvaret olika. En liten konferensgård har kanske bara två roller, ett upplevelsecenter sex.
- Bokningar behöver en ansvarig person per steg. Det kräver att vi vet vilka användare som har vilken funktion.

## Beslut
- Better Auths organization-plugin körs med `dynamicAccessControl: { enabled: true }`. Rollerna lagras per organisation i tabellen `organizationRole` (rollnamn + behörigheter som JSON).
- Behörighetsspråket är oförändrat: `<resurs>:read|write|admin` (ADR 0003). En roll är en namngiven uppsättning sådana behörigheter per resurs.
- `owner` är en fast systemroll med alla behörigheter. Den kan inte ändras eller tas bort, så att en organisation aldrig kan låsa ute sig själv.
- En ny organisation har bara `owner`. Rollmallar kan importeras och redigeras fritt (ADR 0015). Exempel, mallen "Konferensgård":

  | Roll | Skriva | Läsa |
  |---|---|---|
  | Admin | allt, inkl. `role:admin` och `member:admin` | allt |
  | Säljare | kund, kontaktperson, förfrågan, option, offert, bokning | artiklar, lokaler, prislistor |
  | Koordinator | bokning, programpunkt, behov, beläggning | artiklar, lokaler, kunder |
  | Kök | – | bokning, programpunkt, artiklar, blad |
  | Ekonomi | prislista, faktura, betalning | allt |
  | Läsare | – | allt |

- Core slår inte upp roller i databasen. `packages/auth` löser medlemmens roller till faktiska behörigheter en gång per anrop och lägger dem i `ExecuteContext` (`permissions: Record<resurs, action[]>`). `hasPermission` i core kontrollerar mot dem i stället för mot `ROLE_ACTIONS`.
- Nya operationer med paritet i alla ytor: `role.list|get` (`role:read`), `role.create|update|archive` (`role:admin`), `member.list` (`member:read`), `member.assignRole` (`member:admin`).
- API-nycklar utfärdas med ett rollnamn ur organisationens roller. Taket är fortfarande `admin`.

## Konsekvenser
- Ändringen rör core, auth och tenancy. Den ska byggas och granskas på Opus-nivå (CLAUDE.md) och gå igenom `tenancy-review`.
- `ORG_ROLES` och `ROLE_ACTIONS` försvinner som hårdkodade listor. Befintliga organisationer får mallen "Konferensgård" importerad och medlemmarna migreras: `member` → Koordinator, `viewer` → Läsare.
- Paritetstestet behöver testfall per rollmall, så att t.ex. Kök får läsa men inte skriva en bokning.
- AI-assistenten agerar som användaren (ADR 0007). Den kan aldrig få fler behörigheter än användaren, och roll- och medlemsändringar kräver godkännande.
