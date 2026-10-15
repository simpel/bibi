-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "validFrom" DATE,
    "validTo" DATE,
    "discountPercent" DECIMAL(5,2),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceList_organizationId_status_idx" ON "PriceList"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PriceList_organizationId_customerId_idx" ON "PriceList"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_id_organizationId_key" ON "PriceList"("id", "organizationId");

-- CreateIndex
CREATE INDEX "PriceListItem_organizationId_priceListId_idx" ON "PriceListItem"("organizationId", "priceListId");

-- CreateIndex
CREATE INDEX "PriceListItem_organizationId_itemId_idx" ON "PriceListItem"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_itemId_key" ON "PriceListItem"("priceListId", "itemId");

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_organizationId_fkey" FOREIGN KEY ("priceListId", "organizationId") REFERENCES "PriceList"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
