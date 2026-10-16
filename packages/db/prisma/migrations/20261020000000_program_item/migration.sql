-- AlterEnum
ALTER TYPE "EntityBase" ADD VALUE 'PROGRAM_ITEM';

-- CreateTable
CREATE TABLE "ProgramItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT,
    "setupId" TEXT,
    "quantity" INTEGER,
    "responsibleId" TEXT,
    "note" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ProgramItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramItem_organizationId_bookingId_startsAt_idx" ON "ProgramItem"("organizationId", "bookingId", "startsAt");

-- CreateIndex
CREATE INDEX "ProgramItem_organizationId_entityTypeId_idx" ON "ProgramItem"("organizationId", "entityTypeId");

-- CreateIndex
CREATE INDEX "ProgramItem_organizationId_responsibleId_idx" ON "ProgramItem"("organizationId", "responsibleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramItem_id_organizationId_key" ON "ProgramItem"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_bookingId_organizationId_fkey" FOREIGN KEY ("bookingId", "organizationId") REFERENCES "Booking"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_setupId_organizationId_fkey" FOREIGN KEY ("setupId", "organizationId") REFERENCES "Setup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A program item always has a positive length.
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_period_check" CHECK ("endsAt" > "startsAt");

-- A setup describes how an item is set up, so it needs one.
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_setup_needs_item_check" CHECK ("setupId" IS NULL OR "itemId" IS NOT NULL);
