-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('FORTNOX');

-- CreateEnum
CREATE TYPE "IntegrationConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'EXPIRED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "scope" TEXT,
    "accessTokenSealed" TEXT,
    "refreshTokenSealed" TEXT,
    "accessExpiresAt" TIMESTAMP(3),
    "refreshExpiresAt" TIMESTAMP(3),
    "refreshClaimedAt" TIMESTAMP(3),
    "oauthStateHash" TEXT,
    "codeVerifierSealed" TEXT,
    "oauthStartedAt" TIMESTAMP(3),
    "externalCompanyName" TEXT,
    "externalOrgNumber" TEXT,
    "externalTenantId" TEXT,
    "connectedAt" TIMESTAMP(3),
    "connectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationConnection_provider_status_refreshExpiresAt_idx" ON "IntegrationConnection"("provider", "status", "refreshExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_id_organizationId_key" ON "IntegrationConnection"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_organizationId_provider_key" ON "IntegrationConnection"("organizationId", "provider");
