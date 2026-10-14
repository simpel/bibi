-- API keys now belong to an organization (Better Auth `references: "organization"`, ADR 0005).
-- Existing keys referenced a user and are not carried over (no production data yet).
DELETE FROM "apikey";

-- DropIndex
DROP INDEX "apikey_referenceId_idx";

-- AlterTable
ALTER TABLE "apikey" DROP COLUMN "referenceId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "OauthGrantRevocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "OauthGrantRevocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OauthGrantRevocation_organizationId_userId_clientId_key" ON "OauthGrantRevocation"("organizationId", "userId", "clientId");

-- CreateIndex
CREATE INDEX "apikey_organizationId_idx" ON "apikey"("organizationId");

