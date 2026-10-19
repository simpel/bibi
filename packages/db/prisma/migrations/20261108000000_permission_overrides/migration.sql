-- CreateEnum
CREATE TYPE "PermissionSubject" AS ENUM ('MEMBER', 'API_KEY');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- AlterEnum
ALTER TYPE "ActorType" ADD VALUE 'API_KEY';

-- CreateTable
CREATE TABLE "PermissionOverride" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectType" "PermissionSubject" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PermissionOverride_organizationId_subjectType_subjectId_sta_idx" ON "PermissionOverride"("organizationId", "subjectType", "subjectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionOverride_organizationId_subjectType_subjectId_fea_key" ON "PermissionOverride"("organizationId", "subjectType", "subjectId", "feature", "action");
