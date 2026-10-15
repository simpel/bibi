-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "clash" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occurrenceIndex" INTEGER,
ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "BookingSeries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rule" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL,
    "template" JSONB NOT NULL DEFAULT '{}',
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BookingSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingSeries_organizationId_status_startsAt_idx" ON "BookingSeries"("organizationId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "BookingSeries_organizationId_customerId_idx" ON "BookingSeries"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSeries_id_organizationId_key" ON "BookingSeries"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_seriesId_occurrenceIndex_key" ON "Booking"("seriesId", "occurrenceIndex");

-- AddForeignKey
ALTER TABLE "BookingSeries" ADD CONSTRAINT "BookingSeries_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeries" ADD CONSTRAINT "BookingSeries_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_seriesId_organizationId_fkey" FOREIGN KEY ("seriesId", "organizationId") REFERENCES "BookingSeries"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

