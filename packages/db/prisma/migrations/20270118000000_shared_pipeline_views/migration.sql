-- ADR 0111: pipeline views are personal and shared. Expand only: `position` stays (unused) and is
-- dropped in a later release.
ALTER TABLE "Board" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "sharedWithOrganization" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "BoardShare" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BoardShare_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BoardShare_organizationId_userId_idx" ON "BoardShare"("organizationId", "userId");
CREATE UNIQUE INDEX "BoardShare_boardId_userId_key" ON "BoardShare"("boardId", "userId");
CREATE INDEX "Board_organizationId_ownerId_idx" ON "Board"("organizationId", "ownerId");

ALTER TABLE "BoardShare" ADD CONSTRAINT "BoardShare_boardId_organizationId_fkey" FOREIGN KEY ("boardId", "organizationId") REFERENCES "Board"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Each organization's first active board (by position) is its default view, shared with everyone.
UPDATE "Board" b SET "isDefault" = true, "sharedWithOrganization" = true
FROM (
  SELECT DISTINCT ON ("organizationId") "id"
  FROM "Board" WHERE "status" = 'ACTIVE'
  ORDER BY "organizationId", "position", "id"
) first
WHERE b."id" = first."id";

-- Every other board stays visible to everyone, owned by whoever made it (none for SYSTEM).
UPDATE "Board" SET "sharedWithOrganization" = true,
  "ownerId" = CASE WHEN "createdBy" = 'system' THEN NULL ELSE "createdBy" END
WHERE NOT "isDefault";

-- At most one active default view per organization (Prisma cannot express a partial unique index).
CREATE UNIQUE INDEX "Board_one_default" ON "Board" ("organizationId") WHERE "isDefault" AND "status" = 'ACTIVE';
