-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_seriesId_organizationId_fkey";

-- DropIndex
DROP INDEX "Booking_seriesId_occurrenceIndex_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "clash",
DROP COLUMN "occurrenceIndex",
DROP COLUMN "seriesId";

-- DropTable
DROP TABLE "BookingSeries";
