# @okazi/db – context for Claude

Prisma 7 (the `prisma-client` generator, driver adapter `@prisma/adapter-pg`) against Postgres 17 with pgvector.

## Structure
- `prisma.config.ts` – schema folder, migrations, `DATABASE_URL` (reads the repo root `.env` if present; `generate` works without a database).
- `prisma/schema/*.prisma` – one concept per file: `base.prisma` (generator, datasource, `RecordStatus`), `venue.prisma`, `audit.prisma`, `embedding.prisma`, `conversation.prisma` (Conversation, Message), `skill.prisma`. Better Auth tables go in their own file (`auth.prisma`) via the Better Auth CLI.
- `src/generated/` – generated client (gitignored, `pnpm db:generate`).
- `src/scoped/` – `scopedDb` (tenant protection). `src/embeddings/` – raw SQL for the search index.

## Rules
- Business code **always** uses `scopedDb({ organizationId })`, never `getDb()`/`createDb()` directly.
  - Forces `organizationId` on all reads/writes (where, create, upsert) and removes attempts to change it.
  - Hides `status = ARCHIVED` on reads/updates unless you filter on `status` yourself.
  - Models not listed in `ORG_SCOPED_MODELS` (`src/scoped/models.ts`) are rejected (fail closed). New org model → add it there.
  - `SOFT_DELETE_DEFAULTS` controls the default `status` filter per model (Skill: `not ARCHIVED`, others `ACTIVE`).
  - `GLOBAL_READ_MODELS` (Skill): reads see org rows **plus** global rows (`organizationId` null = SYSTEM skills) via an `AND: [{ OR: [{ organizationId }, { organizationId: null }] }]` on top of the caller's `where`. Writes remain locked to the org, so SYSTEM rows can never be created/changed/deleted via `scopedDb` (only via the dedicated seeder in core with `getDb()`).
  - Per-user rules (private conversations, personal skills) live in core, not in the client: `scopedDb` only knows the organization.
  - `AuditLog` and `Message` are append-only. `$queryRaw`/`$executeRaw` are hidden; search/index goes via `$searchEmbeddings`, `$upsertEmbedding`, `$deleteEmbedding`.
  - Relations within an org are also enforced in the database with a composite FK (`Item(venueId, organizationId) → Venue(id, organizationId)`). Do the same for new relations.
  - Writes: use scalar FK fields (`venueId`), not `connect`, because `organizationId` is set as a scalar field.
  - Nested `include` does not filter out archived children – filter explicitly.
- Exception from `scopedDb`: platform code (core `platform/`, ADR 0015) and its tables `SystemLog` and `AiSetting` (`platform.prisma`). They are not org-scoped and `scopedDb` refuses them. `PLATFORM_SCOPE` (`__platform__`) is `AuditLog.organizationId` for platform commands and reserved in `scopedDb`.
- `createSystemLogSink({ retentionDays })` is the logger's sink into `SystemLog`: batches, has a buffer limit and purges old rows every hour.
- Conventions per model: `id String @id @default(cuid(2))`, `organizationId`, `status RecordStatus`, `createdAt`, `updatedAt`, `createdBy`.
- Skill invariants in the migration `ai_data_layer` (hand-written SQL, Prisma's differ does not touch them): CHECK that SYSTEM ⇔ org null/owner null, ORGANIZATION ⇔ org set/owner null, PERSONAL ⇔ both set; slug format; partial unique indexes for slug per scope among non-archived rows and for `source` among SYSTEM.
- The search index for global entities has `organizationId = GLOBAL_EMBEDDING_SCOPE` (`__global__`); `searchEmbeddings` includes them in every org. `scopedDb` refuses that id.
- Migrations: `pnpm --filter @okazi/db migrate:dev --name <name>`; review the SQL. The vector index (HNSW) is partial (`WHERE embedding IS NOT NULL`) so that Prisma's differ ignores it; `search` is a generated tsvector column (`simple` config, sv+en).
- `process.env` is never read here – use `getEnv()` from `@okazi/config`.
