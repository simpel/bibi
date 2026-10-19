-- ADR 0052: the program item is renamed Line. No data to keep, but a rename keeps it anyway.

-- AlterEnum
ALTER TYPE "EntityBase" RENAME VALUE 'PROGRAM_ITEM' TO 'LINE';

-- RenameTable
ALTER TABLE "ProgramItem" RENAME TO "Line";

-- RenameConstraints
ALTER TABLE "Line" RENAME CONSTRAINT "ProgramItem_pkey" TO "Line_pkey";
ALTER TABLE "Line" RENAME CONSTRAINT "ProgramItem_ticketId_organizationId_fkey" TO "Line_ticketId_organizationId_fkey";
ALTER TABLE "Line" RENAME CONSTRAINT "ProgramItem_entityTypeId_organizationId_fkey" TO "Line_entityTypeId_organizationId_fkey";
ALTER TABLE "Line" RENAME CONSTRAINT "ProgramItem_itemId_organizationId_fkey" TO "Line_itemId_organizationId_fkey";
ALTER TABLE "Line" RENAME CONSTRAINT "ProgramItem_setupId_organizationId_fkey" TO "Line_setupId_organizationId_fkey";
ALTER TABLE "Line" RENAME CONSTRAINT "ProgramItem_stateId_organizationId_fkey" TO "Line_stateId_organizationId_fkey";

-- RenameIndexes
ALTER INDEX "ProgramItem_organizationId_ticketId_startsAt_idx" RENAME TO "Line_organizationId_ticketId_startsAt_idx";
ALTER INDEX "ProgramItem_organizationId_entityTypeId_idx" RENAME TO "Line_organizationId_entityTypeId_idx";
ALTER INDEX "ProgramItem_organizationId_stateId_idx" RENAME TO "Line_organizationId_stateId_idx";
ALTER INDEX "ProgramItem_id_organizationId_key" RENAME TO "Line_id_organizationId_key";

-- Requirement.programItemId → lineId
ALTER TABLE "Requirement" RENAME COLUMN "programItemId" TO "lineId";
ALTER TABLE "Requirement" RENAME CONSTRAINT "Requirement_programItemId_organizationId_fkey" TO "Requirement_lineId_organizationId_fkey";
ALTER INDEX "Requirement_organizationId_programItemId_idx" RENAME TO "Requirement_organizationId_lineId_idx";

-- Occupancy rows written by lines carry the source type
UPDATE "Occupancy" SET "sourceType" = 'line' WHERE "sourceType" = 'programItem';
