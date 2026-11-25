-- Tasks (ADR 0117): a new record base TASK, task types with a shape, the Task table, and an
-- optional task subject on notifications and Needs you dismissals. Expand only: new enum values,
-- a new table, new nullable columns, and NeedsYouDismissal.orderId no longer required (a task
-- may have no order). The new enum values are used by the next migration, which commits apart.

-- CreateEnum
CREATE TYPE "TaskShape" AS ENUM ('MEETING', 'DEADLINE');

-- AlterEnum
ALTER TYPE "EntityBase" ADD VALUE 'TASK';

-- AlterEnum
ALTER TYPE "RecordBase" ADD VALUE 'TASK';

-- AlterTable
ALTER TABLE "EntityType" ADD COLUMN     "taskShape" "TaskShape";

-- AlterTable
ALTER TABLE "NeedsYouDismissal" ADD COLUMN     "taskId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "taskId" TEXT;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "orderId" TEXT,
    "itemId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "note" TEXT,
    "doneAt" TIMESTAMP(3),
    "doneById" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_organizationId_customerId_idx" ON "Task"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Task_organizationId_orderId_idx" ON "Task"("organizationId", "orderId");

-- CreateIndex
CREATE INDEX "Task_organizationId_startsAt_idx" ON "Task"("organizationId", "startsAt");

-- CreateIndex
CREATE INDEX "Task_organizationId_entityTypeId_idx" ON "Task"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_id_organizationId_key" ON "Task"("id", "organizationId");

-- CreateIndex
CREATE INDEX "NeedsYouDismissal_taskId_organizationId_idx" ON "NeedsYouDismissal"("taskId", "organizationId");

-- AddForeignKey
ALTER TABLE "NeedsYouDismissal" ADD CONSTRAINT "NeedsYouDismissal_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "Task"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "Task"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_organizationId_fkey" FOREIGN KEY ("contactId", "organizationId") REFERENCES "Contact"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId") REFERENCES "Order"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A meeting ends after it starts; a deadline has no end (the shape is checked in core).
ALTER TABLE "Task" ADD CONSTRAINT "Task_endsAt_after_startsAt"
  CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt");
