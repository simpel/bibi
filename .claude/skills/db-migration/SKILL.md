---
name: db-migration
description: Ändra Prisma-schemat och skapa en migration enligt Okazis databaskonventioner. Använd vid ny modell, kolumn eller index.
---

# Databasmigrering

Konventioner: `docs/beslut/0006-databaskonventioner.md`.

1. Redigera `packages/db/prisma/schema/*.prisma`. Better Auth-tabeller är genererade: ändra inte för hand, kör `pnpm --filter @okazi/auth auth:generate`.
2. Varje affärsmodell: cuid2-`id`, `organizationId` (ingen FK till `organization`), `status` för mjuk radering, `createdAt`, `updatedAt`, `createdBy`, index på `organizationId`. Ingen `DELETE` i appkod.
   Relationer mellan affärsmodeller använder sammansatt FK `[fkId, organizationId]` mot `@@unique([id, organizationId])` (se `Venue`/`Room`) så att rader aldrig korsar organisationer.
3. Lägg modellen i `ORG_SCOPED_MODELS` om den är org-scopad.
4. `pnpm db:generate`, sedan `pnpm --filter @okazi/db migrate:dev --name <beskrivning>`. Committa migrationen i `packages/db/prisma/migrations/`. Redigera aldrig en redan körd migration.
5. pgvector-kolumner och index skrivs som rå SQL i migrationen.
6. Verifiera mot docker-Postgres: `pnpm db:migrate && pnpm test`. CI kör samma kedja.
7. Uppdatera `docs/domanmodell.md` och `docs/artefakter/domanmodell.html`.
