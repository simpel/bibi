-- ADR 0059: customisation groups hang on any item; each option is an item with a price effect,
-- and a chosen option is a line under the line it customises. No production data (ADR 0059).
-- CreateEnum
CREATE TYPE "PriceEffect" AS ENUM ('INCLUDED', 'EXTRA', 'REPLACES');

-- DropForeignKey
ALTER TABLE "ItemPart" DROP CONSTRAINT "ItemPart_customisationGroupId_organizationId_fkey";

-- DropIndex
DROP INDEX "ItemPart_organizationId_customisationGroupId_idx";

-- AlterTable
ALTER TABLE "ItemPart" DROP COLUMN "customisationGroupId";

-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "priceEffect" "PriceEffect";

-- CreateTable
CREATE TABLE "ItemCustomisationOption" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "priceEffect" "PriceEffect" NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemCustomisationOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemCustomisationOption_organizationId_groupId_idx" ON "ItemCustomisationOption"("organizationId", "groupId");

-- CreateIndex
CREATE INDEX "ItemCustomisationOption_organizationId_itemId_idx" ON "ItemCustomisationOption"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCustomisationOption_groupId_itemId_key" ON "ItemCustomisationOption"("groupId", "itemId");

-- AddForeignKey
ALTER TABLE "ItemCustomisationOption" ADD CONSTRAINT "ItemCustomisationOption_groupId_organizationId_fkey" FOREIGN KEY ("groupId", "organizationId") REFERENCES "ItemCustomisationGroup"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCustomisationOption" ADD CONSTRAINT "ItemCustomisationOption_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Only an option line (one with a parent line) carries a price effect.
ALTER TABLE "Line" ADD CONSTRAINT "Line_priceEffect_check" CHECK ("priceEffect" IS NULL OR "parentLineId" IS NOT NULL);

-- An option is chosen at most once per line: concurrent choices of the same option conflict.
CREATE UNIQUE INDEX "Line_option_once_key" ON "Line"("parentLineId", "itemId") WHERE "priceEffect" IS NOT NULL AND "status" = 'ACTIVE';
