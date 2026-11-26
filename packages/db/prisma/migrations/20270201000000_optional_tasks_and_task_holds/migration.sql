-- ADR 0120: a task needs only its type. Customer and contact become optional, the start becomes
-- the optional due time and the end goes, the task type's shape goes, and a task's rooms move
-- to `TaskItem` (related, prebook or book) whose holds are `Occupancy` rows with `taskItemId`.

-- CreateEnum
CREATE TYPE "TaskItemHold" AS ENUM ('RELATED', 'PREBOOK', 'BOOK');

-- Task: customer and contact optional; startsAt -> dueAt (kept), endsAt dropped.
ALTER TABLE "Task" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "contactId" DROP NOT NULL;
ALTER TABLE "Task" RENAME COLUMN "startsAt" TO "dueAt";
ALTER TABLE "Task" ALTER COLUMN "dueAt" DROP NOT NULL;
ALTER INDEX "Task_organizationId_startsAt_idx" RENAME TO "Task_organizationId_dueAt_idx";

-- CreateTable
CREATE TABLE "TaskItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "hold" "TaskItemHold" NOT NULL DEFAULT 'RELATED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TaskItem_pkey" PRIMARY KEY ("id")
);

-- A held room has its own window; a related one has none.
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_window_check" CHECK (
  ("hold" = 'RELATED' AND "startsAt" IS NULL AND "endsAt" IS NULL)
  OR ("hold" <> 'RELATED' AND "startsAt" IS NOT NULL AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt")
);

-- The task's old single room becomes a related room.
INSERT INTO "TaskItem" ("id", "organizationId", "taskId", "itemId", "hold", "createdAt", "updatedAt", "createdBy")
SELECT gen_random_uuid()::text, "organizationId", "id", "itemId", 'RELATED', "createdAt", CURRENT_TIMESTAMP, "createdBy"
  FROM "Task" WHERE "itemId" IS NOT NULL;

ALTER TABLE "Task" DROP CONSTRAINT "Task_itemId_organizationId_fkey";
ALTER TABLE "Task" DROP COLUMN "itemId", DROP COLUMN "endsAt";
ALTER TABLE "EntityType" DROP COLUMN "taskShape";
DROP TYPE "TaskShape";

-- CreateIndex
CREATE UNIQUE INDEX "TaskItem_id_organizationId_key" ON "TaskItem"("id", "organizationId");
CREATE UNIQUE INDEX "TaskItem_taskId_itemId_key" ON "TaskItem"("taskId", "itemId");
CREATE INDEX "TaskItem_organizationId_itemId_idx" ON "TaskItem"("organizationId", "itemId");

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_taskId_organizationId_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "Task"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Occupancy: a hold may come from a task room instead of a line.
ALTER TABLE "Occupancy" ADD COLUMN "taskItemId" TEXT;
CREATE UNIQUE INDEX "Occupancy_taskItemId_type_key" ON "Occupancy"("taskItemId", "type");
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_taskItemId_organizationId_fkey" FOREIGN KEY ("taskItemId", "organizationId") REFERENCES "TaskItem"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Occupancy" DROP CONSTRAINT "Occupancy_hold_kind_check";
ALTER TABLE "Occupancy" DROP CONSTRAINT "Occupancy_line_check";
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_hold_kind_check"
  CHECK (("lineId" IS NOT NULL OR "taskItemId" IS NOT NULL) = ("holdKind" IS NOT NULL AND "holdKind" <> 'NONE'));
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_line_check"
  CHECK (("type" IN ('MAINTENANCE', 'INTERNAL')) = ("lineId" IS NULL AND "taskItemId" IS NULL));
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_one_source_check"
  CHECK (NOT ("lineId" IS NOT NULL AND "taskItemId" IS NOT NULL));
