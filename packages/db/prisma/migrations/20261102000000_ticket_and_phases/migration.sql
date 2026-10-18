-- Ticket replaces Inquiry and Booking; TicketPhase(Transition) replaces BookingStatus(Transition)
-- (ADR 0043). No database holds data worth keeping, so nothing is migrated: the old rows and
-- everything that hangs off them are removed first, then the old tables are dropped.
TRUNCATE TABLE "Booking", "BookingStatus", "BookingStatusTransition", "Inquiry" CASCADE;
DELETE FROM "Occupancy" WHERE "sourceType" IS NOT NULL;
DELETE FROM "AssignmentFollower" WHERE "assignmentId" IN (
  SELECT "id" FROM "Assignment" WHERE "subjectType" IN ('INQUIRY', 'BOOKING')
);
DELETE FROM "Assignment" WHERE "subjectType" IN ('INQUIRY', 'BOOKING');
DELETE FROM "Embedding" WHERE "entityType" IN ('inquiry', 'booking', 'bookingStatus');

-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentSubjectType_new" AS ENUM ('TICKET', 'ITEM');
ALTER TABLE "Assignment" ALTER COLUMN "subjectType" TYPE "AssignmentSubjectType_new" USING ("subjectType"::text::"AssignmentSubjectType_new");
ALTER TYPE "AssignmentSubjectType" RENAME TO "AssignmentSubjectType_old";
ALTER TYPE "AssignmentSubjectType_new" RENAME TO "AssignmentSubjectType";
DROP TYPE "public"."AssignmentSubjectType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EntityBase_new" AS ENUM ('ITEM', 'CUSTOMER', 'CONTACT', 'TICKET', 'REQUIREMENT', 'PROGRAM_ITEM');
ALTER TABLE "EntityType" ALTER COLUMN "base" TYPE "EntityBase_new" USING ((CASE WHEN "base"::text IN ('INQUIRY', 'BOOKING') THEN 'TICKET' ELSE "base"::text END)::"EntityBase_new");
ALTER TYPE "EntityBase" RENAME TO "EntityBase_old";
ALTER TYPE "EntityBase_new" RENAME TO "EntityBase";
DROP TYPE "public"."EntityBase_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_bookingStatusId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_customerId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_entityTypeId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "BookingStatusTransition" DROP CONSTRAINT "BookingStatusTransition_fromStatusId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "BookingStatusTransition" DROP CONSTRAINT "BookingStatusTransition_toStatusId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "InboundEmail" DROP CONSTRAINT "InboundEmail_bookingId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_contactId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_customerId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_entityTypeId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_inquiryId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramItem" DROP CONSTRAINT "ProgramItem_bookingId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_inquiryId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_bookingId_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Sheet" DROP CONSTRAINT "Sheet_bookingId_organizationId_fkey";

-- DropIndex
DROP INDEX "InboundEmail_organizationId_bookingId_receivedAt_idx";

-- DropIndex
DROP INDEX "Option_organizationId_inquiryId_idx";

-- DropIndex
DROP INDEX "Payment_organizationId_bookingId_idx";

-- DropIndex
DROP INDEX "ProgramItem_organizationId_bookingId_startsAt_idx";

-- DropIndex
DROP INDEX "Quote_inquiryId_version_key";

-- DropIndex
DROP INDEX "Quote_organizationId_inquiryId_idx";

-- DropIndex
DROP INDEX "Requirement_organizationId_bookingId_status_idx";

-- DropIndex
DROP INDEX "Sheet_bookingId_sheetDefinitionId_version_key";

-- DropIndex
DROP INDEX "Sheet_organizationId_bookingId_idx";

-- AlterTable
ALTER TABLE "InboundEmail" DROP COLUMN "bookingId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Option" DROP COLUMN "inquiryId",
ADD COLUMN     "ticketId" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "bookingId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProgramItem" DROP COLUMN "bookingId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "inquiryId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Requirement" DROP COLUMN "bookingId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sheet" DROP COLUMN "bookingId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "BookingStatus";

-- DropTable
DROP TABLE "BookingStatusTransition";

-- DropTable
DROP TABLE "Inquiry";

-- DropEnum
DROP TYPE "BookingPhase";

-- DropEnum
DROP TYPE "InquiryStatus";

-- CreateTable
CREATE TABLE "TicketPhase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "entry" BOOLEAN NOT NULL DEFAULT false,
    "terminal" BOOLEAN NOT NULL DEFAULT false,
    "requiresReason" BOOLEAN NOT NULL DEFAULT false,
    "requiresAssignee" BOOLEAN NOT NULL DEFAULT false,
    "invoiceable" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPhaseTransition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromPhaseId" TEXT NOT NULL,
    "toPhaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketPhaseTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reference" INTEGER NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactId" TEXT,
    "phaseId" TEXT NOT NULL,
    "desiredStartsAt" TIMESTAMP(3),
    "desiredEndsAt" TIMESTAMP(3),
    "quantity" INTEGER,
    "estimatedHeadcount" INTEGER,
    "guaranteedHeadcount" INTEGER,
    "budgetMinor" INTEGER,
    "phaseChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phaseReason" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketPhase_organizationId_status_position_idx" ON "TicketPhase"("organizationId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPhase_id_organizationId_key" ON "TicketPhase"("id", "organizationId");

-- CreateIndex
CREATE INDEX "TicketPhaseTransition_organizationId_fromPhaseId_idx" ON "TicketPhaseTransition"("organizationId", "fromPhaseId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPhaseTransition_fromPhaseId_toPhaseId_key" ON "TicketPhaseTransition"("fromPhaseId", "toPhaseId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_status_desiredStartsAt_idx" ON "Ticket"("organizationId", "status", "desiredStartsAt");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_customerId_idx" ON "Ticket"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_phaseId_idx" ON "Ticket"("organizationId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_id_organizationId_key" ON "Ticket"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_organizationId_reference_key" ON "Ticket"("organizationId", "reference");

-- CreateIndex
CREATE INDEX "InboundEmail_organizationId_ticketId_receivedAt_idx" ON "InboundEmail"("organizationId", "ticketId", "receivedAt");

-- CreateIndex
CREATE INDEX "Option_organizationId_ticketId_idx" ON "Option"("organizationId", "ticketId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_ticketId_idx" ON "Payment"("organizationId", "ticketId");

-- CreateIndex
CREATE INDEX "ProgramItem_organizationId_ticketId_startsAt_idx" ON "ProgramItem"("organizationId", "ticketId", "startsAt");

-- CreateIndex
CREATE INDEX "Quote_organizationId_ticketId_idx" ON "Quote"("organizationId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_ticketId_version_key" ON "Quote"("ticketId", "version");

-- CreateIndex
CREATE INDEX "Requirement_organizationId_ticketId_status_idx" ON "Requirement"("organizationId", "ticketId", "status");

-- CreateIndex
CREATE INDEX "Sheet_organizationId_ticketId_idx" ON "Sheet"("organizationId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_ticketId_sheetDefinitionId_version_key" ON "Sheet"("ticketId", "sheetDefinitionId", "version");

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPhaseTransition" ADD CONSTRAINT "TicketPhaseTransition_fromPhaseId_organizationId_fkey" FOREIGN KEY ("fromPhaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPhaseTransition" ADD CONSTRAINT "TicketPhaseTransition_toPhaseId_organizationId_fkey" FOREIGN KEY ("toPhaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_contactId_organizationId_fkey" FOREIGN KEY ("contactId", "organizationId") REFERENCES "Contact"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_phaseId_organizationId_fkey" FOREIGN KEY ("phaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

