# @okazi/db – kontext för Claude

Prisma 7 (`prisma-client`-generatorn, driver adapter `@prisma/adapter-pg`) mot Postgres 17 med pgvector.

## Struktur
- `prisma.config.ts` – schemamapp, migrationer, `DATABASE_URL` (läser repo-rotens `.env` om den finns; `generate` fungerar utan databas).
- `prisma/schema/*.prisma` – ett begrepp per fil: `base.prisma` (generator, datasource, `RecordStatus`), `venue.prisma`, `audit.prisma`, `embedding.prisma`, `conversation.prisma` (Conversation, Message), `skill.prisma`. Better Auth-tabeller läggs i en egen fil (`auth.prisma`) via Better Auth CLI.
- `src/generated/` – genererad klient (gitignorerad, `pnpm db:generate`).
- `src/scoped/` – `scopedDb` (tenant-skydd). `src/embeddings/` – rå SQL för sökindex.

## Regler
- Affärskod använder **alltid** `scopedDb({ organizationId })`, aldrig `getDb()`/`createDb()` direkt.
  - Tvingar `organizationId` på alla läsningar/skrivningar (where, create, upsert) och tar bort försök att ändra det.
  - Döljer `status = ARCHIVED` på läsningar/uppdateringar om du inte själv filtrerar på `status`.
  - Modeller som inte står i `ORG_SCOPED_MODELS` (`src/scoped/models.ts`) avvisas (fail closed). Ny org-modell → lägg till där.
  - `SOFT_DELETE_DEFAULTS` styr standardfiltret på `status` per modell (Skill: `not ARCHIVED`, övriga `ACTIVE`).
  - `GLOBAL_READ_MODELS` (Skill): läsningar ser org-rader **plus** globala rader (`organizationId` null = SYSTEM-skills) via ett `AND: [{ OR: [{ organizationId }, { organizationId: null }] }]` ovanpå anroparens `where`. Skrivningar är fortsatt låsta till org, så SYSTEM-rader kan aldrig skapas/ändras/raderas via `scopedDb` (bara via den dedikerade seedern i core med `getDb()`).
  - Per-användarregler (privata konversationer, personliga skills) ligger i core, inte i klienten: `scopedDb` känner bara till organisationen.
  - `AuditLog` och `Message` är append-only. `$queryRaw`/`$executeRaw` är dolda; sök/index går via `$searchEmbeddings`, `$upsertEmbedding`, `$deleteEmbedding`.
  - Relationer inom org säkras även i databasen med sammansatt FK (`Item(venueId, organizationId) → Venue(id, organizationId)`). Gör likadant för nya relationer.
  - Skrivningar: använd skalära FK-fält (`venueId`), inte `connect`, eftersom `organizationId` sätts som skalärt fält.
  - Nästlade `include` filtrerar inte bort arkiverade barn – filtrera explicit.
- Undantag från `scopedDb`: plattformskod (core `platform/`, ADR 0015) och dess tabeller `SystemLog` och `AiSetting` (`platform.prisma`). De är inte org-scopade och `scopedDb` vägrar dem. `PLATFORM_SCOPE` (`__platform__`) är `AuditLog.organizationId` för plattformskommandon och reserverat i `scopedDb`.
- `createSystemLogSink({ retentionDays })` är loggerns sink mot `SystemLog`: batchar, har en buffertgräns och rensar gamla rader varje timme.
- Konventioner per modell: `id String @id @default(cuid(2))`, `organizationId`, `status RecordStatus`, `createdAt`, `updatedAt`, `createdBy`.
- Skill-invarianter i migrationen `ai_data_layer` (handskriven SQL, Prismas differ rör dem inte): CHECK att SYSTEM ⇔ org null/ägare null, ORGANIZATION ⇔ org satt/ägare null, PERSONAL ⇔ båda satta; slug-format; partiella unika index för slug per scope bland icke-arkiverade och för `source` bland SYSTEM.
- Sökindex för globala entiteter har `organizationId = GLOBAL_EMBEDDING_SCOPE` (`__global__`); `searchEmbeddings` tar med dem i varje org. `scopedDb` vägrar det id:t.
- Migrationer: `pnpm --filter @okazi/db migrate:dev --name <namn>`; granska SQL. Vektorindex (HNSW) är partiellt (`WHERE embedding IS NOT NULL`) så att Prismas differ ignorerar det; `search` är en genererad tsvector-kolumn (`simple`-konfig, sv+en).
- `process.env` läses aldrig här – använd `getEnv()` från `@okazi/config`.
