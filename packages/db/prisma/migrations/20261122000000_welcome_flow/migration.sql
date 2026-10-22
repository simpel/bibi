/*
  Warnings:

  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SetupStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- DropTable
DROP TABLE "UserSettings";

-- DropEnum
DROP TYPE "OnboardingStatus";

-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "setupStatus" "SetupStatus" NOT NULL DEFAULT 'PENDING',
    "legalName" TEXT,
    "orgNumber" TEXT,
    "streetAddress" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SE',
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "avatarKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkingHours" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "breakStartMinute" INTEGER,
    "breakEndMinute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProfile_organizationId_key" ON "OrganizationProfile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkingHours_userId_weekday_key" ON "UserWorkingHours"("userId", "weekday");

-- BEGIN packages/db/sql/sync_user_name.sql
-- Projection (ADR 0051, 0061): "user"."name" is "firstName lastName" of the user's profile.
-- Better Auth reads and shows "name"; only this trigger writes it once a profile exists.
CREATE OR REPLACE FUNCTION sync_user_name() RETURNS trigger AS $$
BEGIN
  UPDATE "user"
     SET "name" = btrim(NEW."firstName" || ' ' || NEW."lastName"),
         "updatedAt" = now()
   WHERE "id" = NEW."userId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profile_sync_name ON "UserProfile";
CREATE TRIGGER user_profile_sync_name
  AFTER INSERT OR UPDATE OF "firstName", "lastName" ON "UserProfile"
  FOR EACH ROW EXECUTE FUNCTION sync_user_name();
-- END packages/db/sql/sync_user_name.sql
