-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previousId" TEXT,
    "quoteStatus" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "terms" TEXT,
    "totalExclVatMinor" INTEGER NOT NULL DEFAULT 0,
    "totalInclVatMinor" INTEGER NOT NULL DEFAULT 0,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "priceUnit" "PriceUnit",
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "vatRatePercent" INTEGER NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "totalExclVatMinor" INTEGER NOT NULL,
    "vatMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quote_organizationId_status_quoteStatus_idx" ON "Quote"("organizationId", "status", "quoteStatus");

-- CreateIndex
CREATE INDEX "Quote_organizationId_inquiryId_idx" ON "Quote"("organizationId", "inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_id_organizationId_key" ON "Quote"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_inquiryId_version_key" ON "Quote"("inquiryId", "version");

-- CreateIndex
CREATE INDEX "OrderLine_organizationId_quoteId_idx" ON "OrderLine"("organizationId", "quoteId");

-- CreateIndex
CREATE INDEX "OrderLine_organizationId_itemId_idx" ON "OrderLine"("organizationId", "itemId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_inquiryId_organizationId_fkey" FOREIGN KEY ("inquiryId", "organizationId") REFERENCES "Inquiry"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_previousId_organizationId_fkey" FOREIGN KEY ("previousId", "organizationId") REFERENCES "Quote"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_quoteId_organizationId_fkey" FOREIGN KEY ("quoteId", "organizationId") REFERENCES "Quote"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
