-- CreateEnum
CREATE TYPE "OccupancyType" AS ENUM ('BOOKING', 'OPTION', 'SETUP', 'MAINTENANCE', 'INTERNAL');

-- CreateTable
CREATE TABLE "Occupancy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "OccupancyType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "note" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Occupancy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Occupancy_organizationId_itemId_startsAt_idx" ON "Occupancy"("organizationId", "itemId", "startsAt");

-- CreateIndex
CREATE INDEX "Occupancy_organizationId_sourceType_sourceId_idx" ON "Occupancy"("organizationId", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Occupancy_id_organizationId_key" ON "Occupancy"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A period always has a positive length.
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_period_check" CHECK ("endsAt" > "startsAt");

-- No two active non-option occupancies on the same item may overlap (ADR 0022). Postgres enforces
-- it, so it also holds for concurrent transactions; core maps a violation (23P01) to CONFLICT.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_no_overlap"
  EXCLUDE USING gist ("itemId" WITH =, tsrange("startsAt", "endsAt", '[)') WITH &&)
  WHERE ("type" <> 'OPTION' AND "status" = 'ACTIVE');
