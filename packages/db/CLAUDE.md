# @okazi/db – kontext för Claude

Prisma 7 (`prisma-client`-generatorn, driver adapter `@prisma/adapter-pg`) mot Postgres 17 med pgvector.

## Struktur
- `prisma.config.ts` – schemamapp, migrationer, `DATABASE_URL` (läser repo-rotens `.env` om den finns; `generate` fungerar utan databas).
- `prisma/schema/*.prisma` – ett begrepp per fil: `base.prisma` (generator, datasource, `RecordStatus`), `venue.prisma`, `audit.prisma`, `embedding.prisma`. Better Auth-tabeller läggs i en egen fil (`auth.prisma`) via Better Auth CLI.
- `src/generated/` – genererad klient (gitignorerad, `pnpm db:generate`).
- `src/scoped/` – `scopedDb` (tenant-skydd). `src/embeddings/` – rå SQL för sökindex.

## Regler
- Affärskod använder **alltid** `scopedDb({ organizationId })`, aldrig `getDb()`/`createDb()` direkt.
  - Tvingar `organizationId` på alla läsningar/skrivningar (where, create, upsert) och tar bort försök att ändra det.
  - Döljer `status = ARCHIVED` på läsningar/uppdateringar om du inte själv filtrerar på `status`.
  - Modeller som inte står i `ORG_SCOPED_MODELS` (`src/scoped/models.ts`) avvisas (fail closed). Ny org-modell → lägg till där.
  - `AuditLog` är append-only. `$queryRaw`/`$executeRaw` är dolda; sök/index går via `$searchEmbeddings`, `$upsertEmbedding`, `$deleteEmbedding`.
  - Relationer inom org säkras även i databasen med sammansatt FK (`Room(venueId, organizationId) → Venue(id, organizationId)`). Gör likadant för nya relationer.
  - Skrivningar: använd skalära FK-fält (`venueId`), inte `connect`, eftersom `organizationId` sätts som skalärt fält.
  - Nästlade `include` filtrerar inte bort arkiverade barn – filtrera explicit.
- Konventioner per modell: `id String @id @default(cuid(2))`, `organizationId`, `status RecordStatus`, `createdAt`, `updatedAt`, `createdBy`.
- Migrationer: `pnpm --filter @okazi/db migrate:dev --name <namn>`; granska SQL. Vektorindex (HNSW) är partiellt (`WHERE embedding IS NOT NULL`) så att Prismas differ ignorerar det; `search` är en genererad tsvector-kolumn (`simple`-konfig, sv+en).
- `process.env` läses aldrig här – använd `getEnv()` från `@okazi/config`.
