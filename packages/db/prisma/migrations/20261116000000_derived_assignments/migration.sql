-- CreateEnum
CREATE TYPE "FollowEffect" AS ENUM ('FOLLOW', 'UNFOLLOW');

-- CreateEnum
CREATE TYPE "SheetRecipientRole" AS ENUM ('ASSIGNEE', 'FOLLOWER');

-- AlterTable
ALTER TABLE "AssignmentFollower" ADD COLUMN     "effect" "FollowEffect" NOT NULL DEFAULT 'FOLLOW';

-- CreateTable
CREATE TABLE "SheetRecipient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SheetRecipientRole" NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SheetRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SheetRecipient_organizationId_userId_idx" ON "SheetRecipient"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetRecipient_sheetId_userId_key" ON "SheetRecipient"("sheetId", "userId");

-- AddForeignKey
ALTER TABLE "SheetRecipient" ADD CONSTRAINT "SheetRecipient_sheetId_organizationId_fkey" FOREIGN KEY ("sheetId", "organizationId") REFERENCES "Sheet"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
