/*
  Warnings:

  - You are about to drop the column `coordinatorId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `salesOwnerId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `salesOwnerId` on the `Inquiry` table. All the data in the column will be lost.
  - You are about to drop the column `responsibleId` on the `ProgramItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AssignmentSubjectType" AS ENUM ('INQUIRY', 'BOOKING', 'ITEM');

-- DropIndex
DROP INDEX "Booking_organizationId_coordinatorId_idx";

-- DropIndex
DROP INDEX "Booking_organizationId_salesOwnerId_idx";

-- DropIndex
DROP INDEX "Inquiry_organizationId_salesOwnerId_idx";

-- DropIndex
DROP INDEX "ProgramItem_organizationId_responsibleId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "coordinatorId",
DROP COLUMN "salesOwnerId";

-- AlterTable
ALTER TABLE "Inquiry" DROP COLUMN "salesOwnerId";

-- AlterTable
ALTER TABLE "ProgramItem" DROP COLUMN "responsibleId";

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectType" "AssignmentSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "responsibilityId" TEXT,
    "assigneeId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentFollower" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AssignmentFollower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_organizationId_assigneeId_status_idx" ON "Assignment"("organizationId", "assigneeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_id_organizationId_key" ON "Assignment"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_organizationId_subjectType_subjectId_responsibil_key" ON "Assignment"("organizationId", "subjectType", "subjectId", "responsibilityId");

-- CreateIndex
CREATE INDEX "AssignmentFollower_organizationId_userId_idx" ON "AssignmentFollower"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentFollower_id_organizationId_key" ON "AssignmentFollower"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentFollower_assignmentId_userId_key" ON "AssignmentFollower"("assignmentId", "userId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_responsibilityId_organizationId_fkey" FOREIGN KEY ("responsibilityId", "organizationId") REFERENCES "Responsibility"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentFollower" ADD CONSTRAINT "AssignmentFollower_assignmentId_organizationId_fkey" FOREIGN KEY ("assignmentId", "organizationId") REFERENCES "Assignment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- One main assignment (no responsibility) per subject: NULLs are distinct in the unique index above.
CREATE UNIQUE INDEX "Assignment_main_subject_key" ON "Assignment"("organizationId", "subjectType", "subjectId") WHERE "responsibilityId" IS NULL;
