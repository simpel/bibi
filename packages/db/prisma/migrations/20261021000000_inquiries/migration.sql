-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'QUALIFIED', 'QUOTED', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactId" TEXT,
    "desiredStartsAt" TIMESTAMP(3),
    "desiredEndsAt" TIMESTAMP(3),
    "quantity" INTEGER,
    "budgetMinor" INTEGER,
    "inquiryStatus" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "lossReason" TEXT,
    "salesOwnerId" TEXT,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_organizationId_status_inquiryStatus_idx" ON "Inquiry"("organizationId", "status", "inquiryStatus");

-- CreateIndex
CREATE INDEX "Inquiry_organizationId_customerId_idx" ON "Inquiry"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Inquiry_organizationId_salesOwnerId_idx" ON "Inquiry"("organizationId", "salesOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_id_organizationId_key" ON "Inquiry"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_contactId_organizationId_fkey" FOREIGN KEY ("contactId", "organizationId") REFERENCES "Contact"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
