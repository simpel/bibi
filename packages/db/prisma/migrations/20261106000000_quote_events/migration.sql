-- Quote events (ADR 0043, 0022): a phase can be entered by a quote event, and an accepted quote
-- records who accepted it, when and how.

-- CreateEnum
CREATE TYPE "PhaseEvent" AS ENUM ('QUOTE_SENT', 'QUOTE_ACCEPTED');

-- CreateEnum
CREATE TYPE "AcceptanceMethod" AS ENUM ('MANUAL');

-- AlterTable
ALTER TABLE "TicketPhase" ADD COLUMN "event" "PhaseEvent";

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "acceptedBy" TEXT,
ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "acceptanceMethod" "AcceptanceMethod";

-- At most one active phase per quote event and organization: concurrent changes fail with a
-- unique violation (CONFLICT) instead of racing.
CREATE UNIQUE INDEX "TicketPhase_one_event_key" ON "TicketPhase"("organizationId", "event") WHERE "event" IS NOT NULL AND "status" = 'ACTIVE';
