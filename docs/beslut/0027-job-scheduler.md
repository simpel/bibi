# 0027 – Jobbschemaläggare: pg-boss i `apps/worker`

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Flera beslut kräver jobb utanför en request:
  - `option.expireDue` förfaller passerade optioner och flyttar upp kön (ADR 0022).
  - Serier ska genereras längre fram än 12 månader (ADR 0023).
  - Inbäddningar ska beräknas asynkront (ADR 0008, issue #11).
  - Utgående e-post behöver omförsök (ADR 0012).
- ADR 0013 lämnar valet öppet: cron-container eller jobbkö i Postgres. Kraven är en server, ingen extra infrastruktur och konfiguration i git.
- Alternativ:
  - **Coolify scheduled task**: bara cron. Ger varken kö eller omförsök, konfigurationen ligger i Coolifys databas och den går inte att köra lokalt.
  - **Graphile Worker**: jämförbar kö i Postgres, men mindre ekosystem.
  - **pg-boss**: kö och cron i Postgres. Omförsök, singleton-nycklar och ett cron-lås gör att ett schema bara körs av en instans.

## Beslut
- **Bibliotek:** pg-boss mot samma Postgres som appen. Det använder ett eget schema (`pgboss`) som pg-boss själv migrerar, utanför Prisma.
- **Process:** en ny app `apps/worker` som körs som egen tjänst från samma Docker-bild som web och mcp (ADR 0013), och lokalt via `pnpm dev`. Webben och MCP lägger bara jobb på kön (`send`) och kör dem aldrig.
- **Jobb = core-operation:** varje jobb anropar en core-operation via `execute`. Ingen affärslogik ligger i workern.
  - Jobbet körs i `runWithLogContext` med `surface: "system"` och ett `requestId` per jobb (ADR 0014).
  - Aktören är SYSTEM. Audit skriver `actorType = SYSTEM`.
- **Tenancy:** ett schemalagt jobb itererar organisationerna och kör operationen en gång per organisation med org-scopad kontext (ADR 0004). Ett fel i en organisation stoppar inte de andra. Det loggas som error med `organizationId`.
- **Jobbdefinitioner i git:** köer, cron-uttryck och omförsöksinställningar definieras i kod i `apps/worker`. Inga scheman sätts i Coolifys UI.
- **Scheman (tidszon Europe/Stockholm):**

  | Jobb | Schema |
  |---|---|
  | `option.expireDue` | var 15:e minut |
  | Serie-horisont (generering bortom 12 månader) | nattligen 03:00 |
  | Inbäddningar | köas vid ändring |
  | Utgående e-post med omförsök | köas vid utskick |
- **Idempotens:** jobb ska tåla att köras igen. `option.expireDue` förfaller bara optioner som fortfarande är `ACTIVE`.
- **Konfiguration:** `DATABASE_URL` läses via `@okazi/config` som i övriga appar. Inga nya hemligheter.

## Konsekvenser
- En container till i `docker-compose.prod.yml`, men ingen ny infrastruktur (ingen Redis).
- Schemat `pgboss` ligger utanför Prisma. Migrationskontrollen och backupen (`pg_dump`) ska ta med det.
- Manuell körning finns kvar: `option.expireDue` är en vanlig operation som också kan anropas från web, GraphQL, REST och MCP (ADR 0003).
- Löser den öppna frågan om schemaläggare i ADR 0013, 0022 och 0023 samt i `CLAUDE.md`.
