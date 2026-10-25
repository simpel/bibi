-- CreateEnum
CREATE TYPE "DateFormat" AS ENUM ('D_MMM_YYYY', 'D_MMMM_YYYY', 'YYYY_MM_DD', 'DD_MM_YYYY', 'MM_DD_YYYY');

-- CreateEnum
CREATE TYPE "ClockFormat" AS ENUM ('H24', 'H12');

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateFormat" "DateFormat",
    "clockFormat" "ClockFormat",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
