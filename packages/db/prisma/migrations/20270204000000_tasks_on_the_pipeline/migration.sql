-- Tasks on the pipeline (ADR 0121): a status may hold tasks without an order ("Tasks can be
-- here"), and such a task sits in one of those statuses. Expand only: both columns are new.

-- AlterTable
ALTER TABLE "OrderStatus" ADD COLUMN     "tasks" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "statusId" TEXT;

-- CreateIndex
CREATE INDEX "Task_organizationId_statusId_idx" ON "Task"("organizationId", "statusId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_organizationId_fkey" FOREIGN KEY ("statusId", "organizationId") REFERENCES "OrderStatus"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every active entry status starts flagged, so existing boards show tasks.
UPDATE "OrderStatus"
SET "tasks" = true
WHERE "entry" = true AND "closes" = false AND "status" = 'ACTIVE';

-- Backfill: open, active tasks without an order sit in their organization's entry status.
UPDATE "Task" AS t
SET "statusId" = s."id"
FROM "OrderStatus" AS s
WHERE s."organizationId" = t."organizationId"
  AND s."entry" = true
  AND s."tasks" = true
  AND s."status" = 'ACTIVE'
  AND t."orderId" IS NULL
  AND t."doneAt" IS NULL
  AND t."status" = 'ACTIVE';
