-- CreateTable
CREATE TABLE "organizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'ACTIVE',
    "createdBy" TEXT,

    CONSTRAINT "organizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizationRole_organizationId_idx" ON "organizationRole"("organizationId");

-- CreateIndex
CREATE INDEX "organizationRole_role_idx" ON "organizationRole"("role");

-- AddForeignKey
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written (Prisma's differ ignores partial indexes and CHECKs; ADR 0014):
-- an active role name is unique per organization; archived names can be reused.
CREATE UNIQUE INDEX "organizationRole_organizationId_role_active_key"
  ON "organizationRole"("organizationId", "role") WHERE "status" = 'ACTIVE';

-- Status is RecordStatus semantics on a Better Auth-generated text column.
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_status_check"
  CHECK ("status" IN ('ACTIVE', 'ARCHIVED'));

-- Role names: no commas (Better Auth stores member roles comma-separated), never "owner".
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_role_check"
  CHECK (position(',' in "role") = 0 AND "role" <> 'owner' AND length(trim("role")) > 0);
