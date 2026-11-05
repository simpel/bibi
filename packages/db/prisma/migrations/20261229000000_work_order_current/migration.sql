-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN "current" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "WorkOrder_organizationId_current_idx" ON "WorkOrder"("organizationId", "current");

-- Backfill: the newest version of each ticket and definition is the current one.
UPDATE "WorkOrder" AS w
SET "current" = true
WHERE w."version" = (
  SELECT MAX(o."version") FROM "WorkOrder" AS o
  WHERE o."ticketId" = w."ticketId" AND o."workOrderDefinitionId" = w."workOrderDefinitionId"
);
