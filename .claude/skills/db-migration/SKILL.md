---
name: db-migration
description: Change the Prisma schema and create a migration following Bibi's database conventions. Use for a new model, column or index.
---

# Database migration

Conventions: `packages/db/CLAUDE.md` (rules and triggers), why: `docs/decisions/0006-database-conventions.md`.

1. Edit `packages/db/prisma/schema/*.prisma`. Better Auth tables are generated: do not edit them by hand, run `pnpm --filter @bibi/auth auth:generate`.
2. Every business model: cuid2 `id`, `organizationId` (no FK to `organization`), `status` for soft delete, `createdAt`, `updatedAt`, `createdBy`, an index on `organizationId`. No `DELETE` in app code.
   Relations between business models use a composite FK `[fkId, organizationId]` against `@@unique([id, organizationId])` (see `Venue`/`Item`) so rows never cross organizations.
3. Add the model to `ORG_SCOPED_MODELS` if it is org-scoped.
4. `pnpm db:generate`, then `pnpm --filter @bibi/db migrate:dev --name <description>`. Commit the migration in `packages/db/prisma/migrations/`. Never edit a migration that has already run.
5. pgvector columns and indexes are written as raw SQL in the migration.
6. Verify against the Docker Postgres: `pnpm db:migrate && pnpm test`. CI runs the same chain.
7. Update `docs/domain-model.md` and `docs/artifacts/domain-model.html`.
