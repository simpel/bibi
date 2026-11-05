-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'sv';
