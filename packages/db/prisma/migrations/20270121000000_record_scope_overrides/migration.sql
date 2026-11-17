-- Record scope overrides (ADR 0113): a member who sees only the orders they are related to.
-- Expand only: a new table; no row means the default, every record.

-- CreateEnum
CREATE TYPE "RecordScope" AS ENUM ('ALL', 'RELATED');

-- CreateTable
CREATE TABLE "RecordScopeOverride" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectType" "PermissionSubject" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "scope" "RecordScope" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RecordScopeOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordScopeOverride_organizationId_subjectType_subjectId_st_idx" ON "RecordScopeOverride"("organizationId", "subjectType", "subjectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecordScopeOverride_organizationId_subjectType_subjectId_ro_key" ON "RecordScopeOverride"("organizationId", "subjectType", "subjectId", "root");
