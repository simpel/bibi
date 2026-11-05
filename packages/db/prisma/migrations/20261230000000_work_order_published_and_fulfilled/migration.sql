-- AlterTable: rename sent columns to published and add fulfilled columns
ALTER TABLE "WorkOrder" RENAME COLUMN "sentAt" TO "publishedAt";
ALTER TABLE "WorkOrder" RENAME COLUMN "sentBy" TO "publishedBy";
ALTER TABLE "WorkOrder" ADD COLUMN "fulfilledAt" TIMESTAMP(3);
ALTER TABLE "WorkOrder" ADD COLUMN "fulfilledBy" TEXT;
