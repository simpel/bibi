# @bibi/db – context for Claude

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
  - Models not listed in `ORG_SCOPED_MODELS` (`src/scoped/models.ts`) are rejected (fail closed). New org model → add it there. Every model is either there or in `UNSCOPED_MODELS` (`GLOBAL_MODELS` + `PLATFORM_MODELS` + `USER_SCOPED_MODELS`); `test/conventions.test.ts` enforces it.
  - `USER_SCOPED_MODELS` (`UserPreference`, ADR 0039; `UserProfile` and `UserWorkingHours`, ADR 0061): no `organizationId`; `scopedDb` pins them to the acting user instead (`userId = actorId` on every where/create/upsert, `userId` stripped from updates) and refuses the system actor (`src/scoped/apply-user-scope.ts`, `test/user-scope.test.ts`).
  - Requires `actorId` and forces `createdBy = actorId` on every create of a model in `CREATED_BY_MODELS` (`src/scoped/conventions.ts`); updates cannot change `createdBy`. Handlers never set it. System work uses `SYSTEM_ACTOR_ID`.
  - `SOFT_DELETE_DEFAULTS` controls the default `status` filter per model (Skill: `not ARCHIVED`, others `ACTIVE`).
  - `GLOBAL_READ_MODELS` (Skill): reads see org rows **plus** global rows (`organizationId` null = SYSTEM skills) via an `AND: [{ OR: [{ organizationId }, { organizationId: null }] }]` on top of the caller's `where`. Writes remain locked to the org, so SYSTEM rows can never be created/changed/deleted via `scopedDb` (only via the dedicated seeder in core with `getDb()`).
  - Per-user rules (private conversations, personal skills) live in core, not in the client: `scopedDb` only knows the organization.
  - `AuditLog` and `Message` are append-only. `$queryRaw`/`$executeRaw` are hidden; search/index goes via `$searchEmbeddings`, `$upsertEmbedding`, `$deleteEmbedding`.
  - Relations within an org are also enforced in the database with a composite FK (`Item(venueId, organizationId) → Venue(id, organizationId)`). Do the same for new relations.
  - Writes: use scalar FK fields (`venueId`), not `connect`, because `organizationId` is set as a scalar field.
  - Nested `include` does not filter out archived children – filter explicitly.
- Exception from `scopedDb`: platform code (core `platform/`, ADR 0015) and its tables `SystemLog` and `AiSetting` (`platform.prisma`). They are not org-scoped and `scopedDb` refuses them. `PLATFORM_SCOPE` (`__platform__`) is `AuditLog.organizationId` for platform commands and reserved in `scopedDb`.
- `createSystemLogSink({ retentionDays })` is the logger's sink into `SystemLog`: batches, has a buffer limit and purges old rows every hour.
- Conventions per model: `id String @id @default(cuid(2))`, `organizationId`, `status RecordStatus`, `createdAt`, `updatedAt`, `createdBy`. Exceptions are listed in `src/scoped/conventions.ts` (`COLUMN_EXCEPTIONS`, `APP_ID_MODELS`, `HARD_DELETE_MODELS`) and in ADR 0006; `pnpm --filter @bibi/db test` fails for an unlisted violation.
- Skill invariants in the migration `ai_data_layer` (hand-written SQL, Prisma's differ does not touch them): CHECK that SYSTEM ⇔ org null/owner null, ORGANIZATION ⇔ org set/owner null, PERSONAL ⇔ both set; slug format; partial unique indexes for slug per scope among non-archived rows and for `source` among SYSTEM.
- The search index for global entities has `organizationId = GLOBAL_EMBEDDING_SCOPE` (`__global__`); `searchEmbeddings` includes them in every org. `scopedDb` refuses that id.
- Migrations: `pnpm --filter @bibi/db migrate:dev --name <name>`; review the SQL. The vector index (HNSW) is partial (`WHERE embedding IS NOT NULL`) so that Prisma's differ ignores it; `search` is a generated tsvector column (`simple` config, sv+en).
- Expand/contract (ADR 0013): production runs `prisma migrate deploy` (`migrate` service in `docker-compose.prod.yml`) before new containers take traffic, and the previous release keeps running against the new schema during rollout and rollback. Every migration must therefore be backward compatible. Expand: add nullable columns, new tables or indexes, and write both old and new shape. Contract: drop or rename columns, add NOT NULL, or tighten constraints only in a later release, after no running code uses the old shape. Never rename or drop in the same release that stops using it.
- `process.env` is never read here – use `getEnv()` from `@bibi/config`.

## Database triggers (projections, ADR 0053)
- Triggers are invisible to Prisma and `check:structure`, so they are listed here. SQL lives one file per function under `sql/` and is applied verbatim by a migration (`test/line-holds-sql.test.ts`); each table with a trigger says so in its Prisma doc comment. Application code never writes what a trigger writes.
- `sync_line_occupancy.sql`: line holds (`Occupancy` `HOLD`/`SETUP`/`TEARDOWN` with `lineId`, one row per line, item and type; buffers carry the hold's kind, ADR 0059). Triggers on `Line` (insert; update of item, setup, buffer minutes, time, state, ticket, status), `ItemState` (`hold`, `released`), `Setup` (`changeoverMinutes`), `Item` (`setupMinutes`, `teardownMinutes`), `EntityType` (`capabilities`, `setupMinutes`, `teardownMinutes`), `Ticket` (`phaseId`, `status`) and `TicketPhase` (`terminal`). Configuration changes re-derive only lines that have not ended. An overlap raises `line_occupancy_conflict`, mapped to `CONFLICT` with `lines.<id>` issues. Checked by the `line-holds` reconciliation; only `features/occupancy/write-operations.ts` (manual blocks) writes `occupancy` in core.
- `domain_history.sql`: the history triggers (ADR 0054). Inserting into `TicketPhaseChange` sets `Ticket.phaseId`, inserting into `LineStateChange` sets `Line.stateId`; a stale insert (a concurrent change won) fails with `history_stale`. Guard triggers on `Ticket` and `Line` refuse any other update of those columns (`history_projection_only`). Every column is owned, derived, a projection or a snapshot (ADR 0051); projections are written only by the database or one named function and have a reconciliation check.
- `sync_user_name.sql`: `user.name` is the projection of `UserProfile.firstName lastName` (ADR 0061). Trigger on `UserProfile` (insert; update of `firstName`, `lastName`). Better Auth still writes `name` at sign-up, before a profile exists; after that no code writes it.
