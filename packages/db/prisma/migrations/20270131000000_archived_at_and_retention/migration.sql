-- Deleting archived records (ADR 0118), expand only: every record with its own page gets an owned
-- `archivedAt` (set by its archive, cleared by its restore), backfilled from `updatedAt` for rows
-- already archived so the retention clock starts at their last change. The organization keeps
-- archived records `archiveRetentionDays` days (1 to 180, 90 by default) before the nightly job
-- deletes them.

ALTER TABLE "Task" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Task" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Customer" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Customer" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Item" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Item" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Venue" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Venue" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "OrderTemplate" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "OrderTemplate" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "PriceList" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "PriceList" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "EntityType" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "EntityType" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Vocabulary" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Vocabulary" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Responsibility" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Responsibility" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "RunSheetDefinition" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "RunSheetDefinition" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Skill" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Skill" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "OrderStatus" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "OrderStatus" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "ItemTypeGroup" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "ItemTypeGroup" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "Order" ADD COLUMN "archivedAt" TIMESTAMP(3);
UPDATE "Order" SET "archivedAt" = "updatedAt" WHERE "status" = 'ARCHIVED';

ALTER TABLE "OrganizationProfile" ADD COLUMN "archiveRetentionDays" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_archiveRetentionDays_range"
  CHECK ("archiveRetentionDays" BETWEEN 1 AND 180);

-- Rows that mean nothing without their parent go with it when an archived record is deleted
-- (ADR 0118): an order's status and estimate history and its mail, a line's state history, a run
-- sheet's recipients, and the relation rows of a responsibility (a trigger projection, ADR 0113).
-- Append-only and trigger-only tables are never deleted by application code, so the database does it.
ALTER TABLE "OrderStatusChange" DROP CONSTRAINT "OrderStatusChange_orderId_organizationId_fkey";
ALTER TABLE "OrderStatusChange" ADD CONSTRAINT "OrderStatusChange_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId")
  REFERENCES "Order"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderEstimate" DROP CONSTRAINT "OrderEstimate_orderId_organizationId_fkey";
ALTER TABLE "OrderEstimate" ADD CONSTRAINT "OrderEstimate_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId")
  REFERENCES "Order"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InboundEmail" DROP CONSTRAINT "InboundEmail_orderId_organizationId_fkey";
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId")
  REFERENCES "Order"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LineStateChange" DROP CONSTRAINT "LineStateChange_lineId_organizationId_fkey";
ALTER TABLE "LineStateChange" ADD CONSTRAINT "LineStateChange_lineId_organizationId_fkey" FOREIGN KEY ("lineId", "organizationId")
  REFERENCES "Line"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RunSheetRecipient" DROP CONSTRAINT "RunSheetRecipient_runSheetId_organizationId_fkey";
ALTER TABLE "RunSheetRecipient" ADD CONSTRAINT "RunSheetRecipient_runSheetId_organizationId_fkey" FOREIGN KEY ("runSheetId", "organizationId")
  REFERENCES "RunSheet"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordRelation" DROP CONSTRAINT "RecordRelation_responsibilityId_organizationId_fkey";
ALTER TABLE "RecordRelation" ADD CONSTRAINT "RecordRelation_responsibilityId_organizationId_fkey" FOREIGN KEY ("responsibilityId", "organizationId")
  REFERENCES "Responsibility"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
