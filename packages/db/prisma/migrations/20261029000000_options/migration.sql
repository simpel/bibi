-- CreateEnum
CREATE TYPE "OptionStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'RELEASED');

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER,
    "sequence" SERIAL NOT NULL,
    "optionStatus" "OptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Option_organizationId_itemId_optionStatus_startsAt_idx" ON "Option"("organizationId", "itemId", "optionStatus", "startsAt");

-- CreateIndex
CREATE INDEX "Option_organizationId_optionStatus_expiresAt_idx" ON "Option"("organizationId", "optionStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "Option_organizationId_inquiryId_idx" ON "Option"("organizationId", "inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Option_id_organizationId_key" ON "Option"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_inquiryId_organizationId_fkey" FOREIGN KEY ("inquiryId", "organizationId") REFERENCES "Inquiry"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
