-- Item states per item type, line states and derived holds (ADR 0044). Options are gone: a soft
-- hold is a line in a SOFT state. No data is kept (ADR 0043): derived holds are dropped and the
-- demo seed recreates them.

-- The overlap rule names the old types; it is recreated below for the new ones.
ALTER TABLE "Occupancy" DROP CONSTRAINT "Occupancy_no_overlap";
DELETE FROM "Occupancy" WHERE "type" IN ('BOOKING', 'OPTION');
-- CreateEnum
CREATE TYPE "HoldKind" AS ENUM ('NONE', 'SOFT', 'HARD');

-- AlterEnum
BEGIN;
CREATE TYPE "OccupancyType_new" AS ENUM ('HOLD', 'SETUP', 'MAINTENANCE', 'INTERNAL');
ALTER TABLE "Occupancy" ALTER COLUMN "type" TYPE "OccupancyType_new" USING ("type"::text::"OccupancyType_new");
ALTER TYPE "OccupancyType" RENAME TO "OccupancyType_old";
ALTER TYPE "OccupancyType_new" RENAME TO "OccupancyType";
DROP TYPE "public"."OccupancyType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_itemId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_ticketId_organizationId_fkey";

-- AlterTable
ALTER TABLE "EntityType" ADD COLUMN     "expiryStateId" TEXT;

-- AlterTable
ALTER TABLE "Occupancy" ADD COLUMN     "holdKind" "HoldKind";

-- AlterTable
ALTER TABLE "ProgramItem" ADD COLUMN     "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stateId" TEXT,
ADD COLUMN     "stateOverridden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "holdsUntil" TIMESTAMP(3);

-- DropTable
DROP TABLE "Option";

-- DropEnum
DROP TYPE "OptionStatus";

-- CreateTable
CREATE TABLE "ItemState" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "initial" BOOLEAN NOT NULL DEFAULT false,
    "hold" "HoldKind" NOT NULL DEFAULT 'NONE',
    "inSheets" BOOLEAN NOT NULL DEFAULT false,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "expires" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemStateTransition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromStateId" TEXT NOT NULL,
    "toStateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemStateTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemState_organizationId_entityTypeId_status_position_idx" ON "ItemState"("organizationId", "entityTypeId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ItemState_id_organizationId_key" ON "ItemState"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ItemStateTransition_organizationId_fromStateId_idx" ON "ItemStateTransition"("organizationId", "fromStateId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemStateTransition_fromStateId_toStateId_key" ON "ItemStateTransition"("fromStateId", "toStateId");

-- CreateIndex
CREATE INDEX "ProgramItem_organizationId_stateId_idx" ON "ProgramItem"("organizationId", "stateId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_holdsUntil_idx" ON "Ticket"("organizationId", "holdsUntil");

-- AddForeignKey
ALTER TABLE "EntityType" ADD CONSTRAINT "EntityType_expiryStateId_organizationId_fkey" FOREIGN KEY ("expiryStateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemState" ADD CONSTRAINT "ItemState_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemStateTransition" ADD CONSTRAINT "ItemStateTransition_fromStateId_organizationId_fkey" FOREIGN KEY ("fromStateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemStateTransition" ADD CONSTRAINT "ItemStateTransition_toStateId_organizationId_fkey" FOREIGN KEY ("toStateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_stateId_organizationId_fkey" FOREIGN KEY ("stateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Exactly one active initial state per item type: concurrent changes that would make a second one
-- fail with a unique violation (CONFLICT) instead of racing.
CREATE UNIQUE INDEX "ItemState_one_initial_key" ON "ItemState"("entityTypeId") WHERE "initial" AND "status" = 'ACTIVE';

-- A hold has a kind; nothing else has one.
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_hold_kind_check" CHECK (("type" = 'HOLD') = ("holdKind" IS NOT NULL AND "holdKind" <> 'NONE'));

-- Hard holds, setup times and manual blocks never overlap on one item; soft holds may.
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_no_overlap"
  EXCLUDE USING gist ("itemId" WITH =, tsrange("startsAt", "endsAt", '[)') WITH &&)
  WHERE ("status" = 'ACTIVE' AND "holdKind" IS DISTINCT FROM 'SOFT');
