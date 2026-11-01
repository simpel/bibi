-- DropIndex
DROP INDEX "TicketStatusGate_toStatusId_fromStatusId_key_key";

-- CreateTable
CREATE TABLE "AccountingSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "receivableAccount" TEXT NOT NULL DEFAULT '1510',
    "clearingAccount" TEXT NOT NULL DEFAULT '1580',
    "advancesAccount" TEXT NOT NULL DEFAULT '2420',
    "feesAccount" TEXT NOT NULL DEFAULT '6570',
    "roundingAccount" TEXT NOT NULL DEFAULT '3740',
    "revenueAccount" TEXT NOT NULL DEFAULT '3001',
    "vat25Account" TEXT NOT NULL DEFAULT '2611',
    "vat12Account" TEXT NOT NULL DEFAULT '2621',
    "vat6Account" TEXT NOT NULL DEFAULT '2631',
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AccountingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT,
    "itemId" TEXT,
    "account" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RevenueAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingSettings_organizationId_key" ON "AccountingSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingSettings_id_organizationId_key" ON "AccountingSettings"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueAccount_organizationId_entityTypeId_key" ON "RevenueAccount"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueAccount_organizationId_itemId_key" ON "RevenueAccount"("organizationId", "itemId");

-- AddForeignKey
ALTER TABLE "RevenueAccount" ADD CONSTRAINT "RevenueAccount_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueAccount" ADD CONSTRAINT "RevenueAccount_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one target per row (ADR 0077): an item type or an item.
ALTER TABLE "RevenueAccount" ADD CONSTRAINT "RevenueAccount_one_target"
  CHECK (("entityTypeId" IS NULL) <> ("itemId" IS NULL));
