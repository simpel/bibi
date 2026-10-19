/*
  Warnings:

  - You are about to drop the column `quantity` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `quantityBasis` on the `TicketTemplateLine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "unitPriceMinor" INTEGER,
ADD COLUMN     "vatRatePercent" INTEGER,
ALTER COLUMN "startsAt" DROP NOT NULL,
ALTER COLUMN "endsAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "TicketTemplateLine" DROP COLUMN "quantityBasis";

-- DropEnum
DROP TYPE "TemplateQuantityBasis";

-- A line is timed (both set) or untimed (both null).
ALTER TABLE "Line" ADD CONSTRAINT "Line_timed_or_untimed" CHECK (("startsAt" IS NULL) = ("endsAt" IS NULL));
