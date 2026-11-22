-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'SUPERSEDED';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "versionId" TEXT;

-- CreateTable
CREATE TABLE "OrderVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "restoredFromId" TEXT,
    "contentHash" TEXT NOT NULL,
    "estimatedHeadcount" INTEGER,
    "guaranteedHeadcount" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "OrderVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVersionLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "parentLineId" TEXT,
    "role" "LineRole",
    "alternativeGroupId" TEXT,
    "entityTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "itemId" TEXT,
    "layoutId" TEXT,
    "setupMinutes" INTEGER,
    "teardownMinutes" INTEGER,
    "quantity" INTEGER,
    "unitPriceMinor" INTEGER,
    "discountPercent" DECIMAL(5,2),
    "vatRatePercent" INTEGER,
    "priceEffect" "PriceEffect",
    "note" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "OrderVersionLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderVersion_organizationId_orderId_idx" ON "OrderVersion"("organizationId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderVersion_id_organizationId_key" ON "OrderVersion"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderVersion_orderId_number_key" ON "OrderVersion"("orderId", "number");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_versionId_idx" ON "OrderVersionLine"("organizationId", "versionId");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_lineId_idx" ON "OrderVersionLine"("organizationId", "lineId");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_parentLineId_idx" ON "OrderVersionLine"("organizationId", "parentLineId");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_alternativeGroupId_idx" ON "OrderVersionLine"("organizationId", "alternativeGroupId");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_entityTypeId_idx" ON "OrderVersionLine"("organizationId", "entityTypeId");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_itemId_idx" ON "OrderVersionLine"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "OrderVersionLine_organizationId_layoutId_idx" ON "OrderVersionLine"("organizationId", "layoutId");

-- CreateIndex
CREATE INDEX "Quote_organizationId_versionId_idx" ON "Quote"("organizationId", "versionId");

-- AddForeignKey
ALTER TABLE "OrderVersion" ADD CONSTRAINT "OrderVersion_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId") REFERENCES "Order"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersion" ADD CONSTRAINT "OrderVersion_restoredFromId_organizationId_fkey" FOREIGN KEY ("restoredFromId", "organizationId") REFERENCES "OrderVersion"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_versionId_organizationId_fkey" FOREIGN KEY ("versionId", "organizationId") REFERENCES "OrderVersion"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_lineId_organizationId_fkey" FOREIGN KEY ("lineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_parentLineId_organizationId_fkey" FOREIGN KEY ("parentLineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_alternativeGroupId_organizationId_fkey" FOREIGN KEY ("alternativeGroupId", "organizationId") REFERENCES "AlternativeGroup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVersionLine" ADD CONSTRAINT "OrderVersionLine_layoutId_organizationId_fkey" FOREIGN KEY ("layoutId", "organizationId") REFERENCES "SetupLayout"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_versionId_organizationId_fkey" FOREIGN KEY ("versionId", "organizationId") REFERENCES "OrderVersion"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

