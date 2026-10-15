-- CreateEnum
CREATE TYPE "BookingPhase" AS ENUM ('TENTATIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BookingStatus" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "phase" "BookingPhase" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BookingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusTransition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromStatusId" TEXT NOT NULL,
    "toStatusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BookingStatusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingStatus_organizationId_status_position_idx" ON "BookingStatus"("organizationId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "BookingStatus_id_organizationId_key" ON "BookingStatus"("id", "organizationId");

-- CreateIndex
CREATE INDEX "BookingStatusTransition_organizationId_fromStatusId_idx" ON "BookingStatusTransition"("organizationId", "fromStatusId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingStatusTransition_fromStatusId_toStatusId_key" ON "BookingStatusTransition"("fromStatusId", "toStatusId");

-- AddForeignKey
ALTER TABLE "BookingStatusTransition" ADD CONSTRAINT "BookingStatusTransition_fromStatusId_organizationId_fkey" FOREIGN KEY ("fromStatusId", "organizationId") REFERENCES "BookingStatus"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusTransition" ADD CONSTRAINT "BookingStatusTransition_toStatusId_organizationId_fkey" FOREIGN KEY ("toStatusId", "organizationId") REFERENCES "BookingStatus"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
