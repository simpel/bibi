-- CreateEnum
CREATE TYPE "InvoiceProvider" AS ENUM ('STRIPE', 'FORTNOX');

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "depositPercent" INTEGER,
    "depositMinimumMinor" INTEGER,
    "invoiceProvider" "InvoiceProvider",
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSettings_organizationId_key" ON "PaymentSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSettings_id_organizationId_key" ON "PaymentSettings"("id", "organizationId");
