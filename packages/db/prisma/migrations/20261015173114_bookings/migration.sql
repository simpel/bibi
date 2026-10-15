-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reference" INTEGER NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingStatusId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "estimatedHeadcount" INTEGER,
    "guaranteedHeadcount" INTEGER,
    "salesOwnerId" TEXT,
    "coordinatorId" TEXT,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_organizationId_status_startsAt_idx" ON "Booking"("organizationId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_organizationId_customerId_idx" ON "Booking"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_bookingStatusId_idx" ON "Booking"("organizationId", "bookingStatusId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_salesOwnerId_idx" ON "Booking"("organizationId", "salesOwnerId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_coordinatorId_idx" ON "Booking"("organizationId", "coordinatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_id_organizationId_key" ON "Booking"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_organizationId_reference_key" ON "Booking"("organizationId", "reference");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookingStatusId_organizationId_fkey" FOREIGN KEY ("bookingStatusId", "organizationId") REFERENCES "BookingStatus"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
