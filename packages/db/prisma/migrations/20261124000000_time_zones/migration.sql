-- ADR 0064: the organization's zone (required, existing rows get Europe/Stockholm) and a venue's
-- own zone (null = the organization's).
-- AlterTable
ALTER TABLE "OrganizationProfile" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Europe/Stockholm';

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "timeZone" TEXT;
