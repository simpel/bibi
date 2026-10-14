-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SkillScope" AS ENUM ('SYSTEM', 'ORGANIZATION', 'PERSONAL');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "approvedBy" TEXT;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" "MessageRole" NOT NULL,
    "parts" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "actorType" "ActorType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "scope" "SkillScope" NOT NULL,
    "organizationId" TEXT,
    "ownerUserId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "allowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SkillStatus" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT,
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_organizationId_ownerUserId_status_updatedAt_idx" ON "Conversation"("organizationId", "ownerUserId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_id_organizationId_key" ON "Conversation"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Message_organizationId_conversationId_idx" ON "Message"("organizationId", "conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_sequence_key" ON "Message"("conversationId", "sequence");

-- CreateIndex
CREATE INDEX "Skill_organizationId_scope_status_idx" ON "Skill"("organizationId", "scope", "status");

-- CreateIndex
CREATE INDEX "Skill_source_idx" ON "Skill"("source");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_organizationId_fkey" FOREIGN KEY ("conversationId", "organizationId") REFERENCES "Conversation"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Skill scope invariants (Prisma cannot express CHECK constraints; its differ leaves them alone).
-- SYSTEM rows are global (no org, no owner); ORGANIZATION rows belong to one org; PERSONAL rows
-- belong to one user in one org. A scopedDb write always forces organizationId, so it can never
-- produce or modify a SYSTEM row.
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_scope_ownership_check" CHECK (
  ("scope" = 'SYSTEM' AND "organizationId" IS NULL AND "ownerUserId" IS NULL)
  OR ("scope" = 'ORGANIZATION' AND "organizationId" IS NOT NULL AND "ownerUserId" IS NULL)
  OR ("scope" = 'PERSONAL' AND "organizationId" IS NOT NULL AND "ownerUserId" IS NOT NULL)
);
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Slug uniqueness per scope among non-archived skills. Partial indexes, so Prisma's differ ignores them.
CREATE UNIQUE INDEX "Skill_system_slug_uidx" ON "Skill"("slug")
  WHERE "scope" = 'SYSTEM' AND "status" <> 'ARCHIVED';
CREATE UNIQUE INDEX "Skill_organization_slug_uidx" ON "Skill"("organizationId", "slug")
  WHERE "scope" = 'ORGANIZATION' AND "status" <> 'ARCHIVED';
CREATE UNIQUE INDEX "Skill_personal_slug_uidx" ON "Skill"("organizationId", "ownerUserId", "slug")
  WHERE "scope" = 'PERSONAL' AND "status" <> 'ARCHIVED';
CREATE UNIQUE INDEX "Skill_system_source_uidx" ON "Skill"("source") WHERE "scope" = 'SYSTEM';

-- Messages are append-only and ordered from 0.
ALTER TABLE "Message" ADD CONSTRAINT "Message_sequence_check" CHECK ("sequence" >= 0);
