-- CreateEnum
CREATE TYPE "ReservationState" AS ENUM ('PENDING_PAYMENT', 'BOOKED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('STAFF', 'WEB', 'API');

-- CreateEnum
CREATE TYPE "ReservationCanceller" AS ENUM ('GUEST', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TableHoldKind" AS ENUM ('RESERVATION', 'BLOCK', 'ONLINE_ONLY');

-- AlterTable
ALTER TABLE "FloorElement" ADD COLUMN     "maxCovers" INTEGER,
ADD COLUMN     "minCovers" INTEGER,
ADD COLUMN     "onlineBookable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DiningRoom" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "openUntil" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "DiningRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningService" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roomItemId" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weekdays" INTEGER[],
    "firstStartMinute" INTEGER NOT NULL,
    "lastStartMinute" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "slotMinutes" INTEGER NOT NULL DEFAULT 15,
    "turnTimes" JSONB NOT NULL,
    "maxCoversPerSlot" INTEGER,
    "minMinutesAhead" INTEGER NOT NULL DEFAULT 120,
    "maxDaysAhead" INTEGER NOT NULL DEFAULT 60,
    "changeCutoffMinutes" INTEGER NOT NULL DEFAULT 180,
    "maxOnlineParty" INTEGER NOT NULL DEFAULT 8,
    "depositFromParty" INTEGER,
    "depositPerCoverMinor" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "DiningService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningServiceException" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "firstStartMinute" INTEGER,
    "lastStartMinute" INTEGER,
    "layoutId" TEXT,
    "maxCoversPerSlot" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "DiningServiceException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableCombination" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minCovers" INTEGER,
    "maxCovers" INTEGER,
    "onlineBookable" BOOLEAN NOT NULL DEFAULT true,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TableCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableCombinationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "combinationId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TableCombinationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roomItemId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "partySize" INTEGER NOT NULL,
    "state" "ReservationState" NOT NULL DEFAULT 'BOOKED',
    "source" "ReservationSource" NOT NULL,
    "bookerName" TEXT,
    "bookerPhone" TEXT,
    "bookerEmail" TEXT,
    "note" TEXT,
    "customerId" TEXT,
    "contactId" TEXT,
    "orderId" TEXT,
    "publicToken" TEXT NOT NULL,
    "paymentExpiresAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" "ReservationCanceller",
    "cancelReason" TEXT,
    "erasedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationRequirement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "vocabularyValueId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ReservationRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableHold" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "kind" "TableHoldKind" NOT NULL,
    "reservationId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TableHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoKey" TEXT,
    "coverKey" TEXT,
    "accentColor" TEXT,
    "intro" JSONB NOT NULL DEFAULT '{}',
    "policy" JSONB NOT NULL DEFAULT '{}',
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "embedOrigins" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BookingPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiningRoom_id_organizationId_key" ON "DiningRoom"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DiningRoom_itemId_organizationId_key" ON "DiningRoom"("itemId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DiningRoom_organizationId_slug_key" ON "DiningRoom"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "DiningService_organizationId_roomItemId_status_idx" ON "DiningService"("organizationId", "roomItemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DiningService_id_organizationId_key" ON "DiningService"("id", "organizationId");

-- CreateIndex
CREATE INDEX "DiningServiceException_organizationId_serviceId_idx" ON "DiningServiceException"("organizationId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DiningServiceException_id_organizationId_key" ON "DiningServiceException"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DiningServiceException_serviceId_date_key" ON "DiningServiceException"("serviceId", "date");

-- CreateIndex
CREATE INDEX "TableCombination_organizationId_layoutId_status_idx" ON "TableCombination"("organizationId", "layoutId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TableCombination_id_organizationId_key" ON "TableCombination"("id", "organizationId");

-- CreateIndex
CREATE INDEX "TableCombinationMember_organizationId_elementId_idx" ON "TableCombinationMember"("organizationId", "elementId");

-- CreateIndex
CREATE UNIQUE INDEX "TableCombinationMember_id_organizationId_key" ON "TableCombinationMember"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TableCombinationMember_combinationId_elementId_key" ON "TableCombinationMember"("combinationId", "elementId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_publicToken_key" ON "Reservation"("publicToken");

-- CreateIndex
CREATE INDEX "Reservation_organizationId_roomItemId_startsAt_idx" ON "Reservation"("organizationId", "roomItemId", "startsAt");

-- CreateIndex
CREATE INDEX "Reservation_organizationId_state_idx" ON "Reservation"("organizationId", "state");

-- CreateIndex
CREATE INDEX "Reservation_organizationId_customerId_idx" ON "Reservation"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_id_organizationId_key" ON "Reservation"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ReservationRequirement_organizationId_vocabularyValueId_idx" ON "ReservationRequirement"("organizationId", "vocabularyValueId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationRequirement_id_organizationId_key" ON "ReservationRequirement"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationRequirement_reservationId_vocabularyValueId_key" ON "ReservationRequirement"("reservationId", "vocabularyValueId");

-- CreateIndex
CREATE INDEX "TableHold_organizationId_elementId_startsAt_idx" ON "TableHold"("organizationId", "elementId", "startsAt");

-- CreateIndex
CREATE INDEX "TableHold_organizationId_reservationId_idx" ON "TableHold"("organizationId", "reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "TableHold_id_organizationId_key" ON "TableHold"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPage_organizationId_key" ON "BookingPage"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPage_slug_key" ON "BookingPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPage_id_organizationId_key" ON "BookingPage"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FloorElement_id_organizationId_key" ON "FloorElement"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "DiningRoom" ADD CONSTRAINT "DiningRoom_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningService" ADD CONSTRAINT "DiningService_roomItemId_organizationId_fkey" FOREIGN KEY ("roomItemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningService" ADD CONSTRAINT "DiningService_layoutId_organizationId_fkey" FOREIGN KEY ("layoutId", "organizationId") REFERENCES "SetupLayout"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningServiceException" ADD CONSTRAINT "DiningServiceException_serviceId_organizationId_fkey" FOREIGN KEY ("serviceId", "organizationId") REFERENCES "DiningService"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningServiceException" ADD CONSTRAINT "DiningServiceException_layoutId_organizationId_fkey" FOREIGN KEY ("layoutId", "organizationId") REFERENCES "SetupLayout"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombination" ADD CONSTRAINT "TableCombination_layoutId_organizationId_fkey" FOREIGN KEY ("layoutId", "organizationId") REFERENCES "SetupLayout"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombinationMember" ADD CONSTRAINT "TableCombinationMember_combinationId_organizationId_fkey" FOREIGN KEY ("combinationId", "organizationId") REFERENCES "TableCombination"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombinationMember" ADD CONSTRAINT "TableCombinationMember_elementId_organizationId_fkey" FOREIGN KEY ("elementId", "organizationId") REFERENCES "FloorElement"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomItemId_organizationId_fkey" FOREIGN KEY ("roomItemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_serviceId_organizationId_fkey" FOREIGN KEY ("serviceId", "organizationId") REFERENCES "DiningService"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_contactId_organizationId_fkey" FOREIGN KEY ("contactId", "organizationId") REFERENCES "Contact"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId") REFERENCES "Order"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequirement" ADD CONSTRAINT "ReservationRequirement_reservationId_organizationId_fkey" FOREIGN KEY ("reservationId", "organizationId") REFERENCES "Reservation"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequirement" ADD CONSTRAINT "ReservationRequirement_vocabularyValueId_organizationId_fkey" FOREIGN KEY ("vocabularyValueId", "organizationId") REFERENCES "VocabularyValue"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableHold" ADD CONSTRAINT "TableHold_elementId_organizationId_fkey" FOREIGN KEY ("elementId", "organizationId") REFERENCES "FloorElement"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableHold" ADD CONSTRAINT "TableHold_reservationId_organizationId_fkey" FOREIGN KEY ("reservationId", "organizationId") REFERENCES "Reservation"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;


-- Hand-written (ADR 0119); Prisma's differ does not touch these.

-- Two active holds never share a table at the same time (btree_gist, as for Occupancy).
ALTER TABLE "TableHold" ADD CONSTRAINT "TableHold_no_overlap"
  EXCLUDE USING gist ("elementId" WITH =, tsrange("startsAt", "endsAt", '[)') WITH &&)
  WHERE ("status" = 'ACTIVE');

-- A reservation's hold names it; a block names none.
ALTER TABLE "TableHold" ADD CONSTRAINT "TableHold_reservation_kind_check"
  CHECK (("kind" = 'RESERVATION') = ("reservationId" IS NOT NULL));
ALTER TABLE "TableHold" ADD CONSTRAINT "TableHold_span_check" CHECK ("endsAt" > "startsAt");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_span_check" CHECK ("endsAt" > "startsAt");
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_party_check" CHECK ("partySize" >= 1);
-- A contact needs its customer.
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_contact_needs_customer"
  CHECK ("contactId" IS NULL OR "customerId" IS NOT NULL);

ALTER TABLE "ReservationRequirement" ADD CONSTRAINT "ReservationRequirement_quantity_check"
  CHECK ("quantity" >= 1);

ALTER TABLE "DiningService" ADD CONSTRAINT "DiningService_minutes_check"
  CHECK ("firstStartMinute" >= 0 AND "lastStartMinute" >= "firstStartMinute" AND "lastStartMinute" < 1440);
ALTER TABLE "DiningService" ADD CONSTRAINT "DiningService_slot_check" CHECK ("slotMinutes" BETWEEN 5 AND 120);
ALTER TABLE "DiningService" ADD CONSTRAINT "DiningService_season_check"
  CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validUntil" > "validFrom");

ALTER TABLE "DiningServiceException" ADD CONSTRAINT "DiningServiceException_minutes_check"
  CHECK (("firstStartMinute" IS NULL) = ("lastStartMinute" IS NULL)
    AND ("firstStartMinute" IS NULL OR ("firstStartMinute" >= 0 AND "lastStartMinute" >= "firstStartMinute" AND "lastStartMinute" < 1440)));

ALTER TABLE "TableCombination" ADD CONSTRAINT "TableCombination_covers_check"
  CHECK ("minCovers" IS NULL OR "maxCovers" IS NULL OR "maxCovers" >= "minCovers");
ALTER TABLE "FloorElement" ADD CONSTRAINT "FloorElement_covers_check"
  CHECK ("minCovers" IS NULL OR "maxCovers" IS NULL OR "maxCovers" >= "minCovers");

-- A room slug and a page slug are lowercase words joined by dashes.
ALTER TABLE "DiningRoom" ADD CONSTRAINT "DiningRoom_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "BookingPage" ADD CONSTRAINT "BookingPage_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
