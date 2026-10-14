# 0014 – Systemloggning

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- `AuditLog` (ADR 0006) loggar lyckade mutationer i databasen. Det är verksamhetens spår: vem ändrade vad.
- Allt annat syntes inte: frågor (queries), nekade och ogiltiga anrop, interna fel, inloggningar, mejl, AI-körningar och afterCommit-fel (som sväljdes tyst). Felsökning byggde på utspridda `console.*`.
- Ett anrop går ofta genom flera ytor (webbchatt → AI → MCP → core). Utan gemensamt id går kedjan inte att följa.
- Okazi lagrar inte hälsodata per gäst, bara aggregat (t.ex. 13 gäster, varav 3 med allergier). Loggar ska ändå inte bli en läcka för personuppgifter som namn och mejl.

## Beslut
- **Två lager, olika syften.**
  - `AuditLog` (databas): lyckade mutationer, i samma transaktion som ändringen. Oförändrat, men raden får `requestId` och `surface`.
  - Systemlogg (stdout, JSON): **varje** operation och varje systemhändelse. Samlas av driftmiljön (ADR 0013).
- **Paket `@okazi/logger`** (pino). Enda vägen att logga. `console.*` är förbjudet i appkod (Biome `noConsole`).
- **Händelser, inte meningar.** Varje rad har ett stabilt `event` (`<område>.<händelse>`, t.ex. `operation.completed`, `http.request`, `auth.request`, `mail.sent`). Fält är strukturerade, så loggen kan frågas.
- **Request-kontext via `AsyncLocalStorage`.** Varje ingång (webb, GraphQL, REST, MCP, chatt, CLI) öppnar en kontext med `requestId` och `surface`. Efter autentisering läggs `organizationId`, `userId` och `actorType` till. Alla rader inom anropet får fälten automatiskt.
- **Korrelation.** Inkommande `x-request-id` återanvänds om det är giltigt, annars skapas ett nytt. Svaret skickar tillbaka det. Assistenten skickar det vidare till MCP, så hela AI-kedjan delar id.
- **Core loggar varje `execute`.** En rad per anrop oavsett utfall:
  - `operation.completed` (info): lyckat.
  - `operation.rejected` (warn): validering, behörighet, saknas, konflikt.
  - `operation.failed` (error): internt fel, med orsak och stack.
  - `operation.afterCommitFailed` (error): t.ex. sökindexering.
  - Fält: operation, kind, entityType, utfall, felkod, `durationMs` och aktör.
- **Ingen payload i loggen.** Indata och utdata loggas aldrig. Sådant hör hemma i `AuditLog`, som är org-scopad och behörighetsstyrd. Som extra skydd redigeras kända hemliga fält (lösenord, token, cookie, API-nyckel) bort. Mejladresser loggas bara som domän.
- **Nivå och format via `@okazi/config`.** `LOG_LEVEL` (standard `info`, `silent` i test). `LOG_FORMAT` `json` eller `pretty` (standard `pretty` i utveckling).
- **Processfel.** Next `onRequestError` och Node `uncaughtException`/`unhandledRejection` loggas som `process.*`/`http.unhandledError`.

## Tillägg 2026-10-14
- Systemloggen sparas också i Postgres (`SystemLog`) för plattformsadmins vy, med retention via `SYSTEM_LOG_RETENTION_DAYS`. Se ADR 0015.

## Konsekvenser
- Ny ingång måste använda `withRequestLogging` (HTTP) eller `runWithLogContext`. Annars blir `surface` `system` och `requestId` saknas. Testerna i respektive adapter fångar det.
- Queries loggas på info-nivå. Volymen styrs med `LOG_LEVEL` och retention i driftens logglager.
- `AuditLog` och systemloggen kopplas ihop med `requestId`.
- **Öppet:**
  - Loggmottagare i drift (Loki, Better Stack, Axiom) och retention. Beslutas med ADR 0013.
  - `AuditLog` saknar läsoperationer i graph, REST och MCP (paritet).
