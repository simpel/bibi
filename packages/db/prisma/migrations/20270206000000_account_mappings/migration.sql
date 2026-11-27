-- ADR 0123: purposes mapped to the connected ledger's accounts. Expand step (ADR 0013): the old
-- AccountingSettings, RevenueAccount, setupIssues and setupCheckedAt stay until a later release.

-- CreateEnum
CREATE TYPE "AccountPurpose" AS ENUM ('ADVANCES', 'REVENUE_DEFAULT', 'ENTITY_TYPE');

-- AlterTable: the accounting system's accounts as last read
ALTER TABLE "ProviderConnection" ADD COLUMN "chart" JSONB,
ADD COLUMN "chartSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AccountMapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "purpose" "AccountPurpose" NOT NULL,
    "entityTypeId" TEXT,
    "providerAccount" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AccountMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountMapping_organizationId_idx" ON "AccountMapping"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountMapping_connectionId_purpose_entityTypeId_key" ON "AccountMapping"("connectionId", "purpose", "entityTypeId");

-- One row per connection and fixed purpose (NULL entityTypeId is distinct in the index above).
CREATE UNIQUE INDEX "AccountMapping_one_purpose" ON "AccountMapping"("connectionId", "purpose") WHERE "entityTypeId" IS NULL;

-- An item type is named exactly for an ENTITY_TYPE mapping.
ALTER TABLE "AccountMapping" ADD CONSTRAINT "AccountMapping_entity_type_check"
  CHECK (("purpose" = 'ENTITY_TYPE') = ("entityTypeId" IS NOT NULL));

-- AddForeignKey
ALTER TABLE "AccountMapping" ADD CONSTRAINT "AccountMapping_connectionId_organizationId_fkey" FOREIGN KEY ("connectionId", "organizationId") REFERENCES "ProviderConnection"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMapping" ADD CONSTRAINT "AccountMapping_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Copy today's numbers onto each organization's connected ledger (Fortnox or Visma). Both identify
-- an account by its number; Spiris keeps matching the coding that books to a numeric reference.
-- Item-level rows are not copied (no screen offered them).
INSERT INTO "AccountMapping" ("id", "organizationId", "connectionId", "purpose", "entityTypeId", "providerAccount", "updatedAt")
SELECT gen_random_uuid()::text, pc."organizationId", pc."id", 'ADVANCES',
       NULL, COALESCE(s."advancesAccount", '2420'), CURRENT_TIMESTAMP
FROM "ProviderConnection" pc
LEFT JOIN "AccountingSettings" s ON s."organizationId" = pc."organizationId"
WHERE pc."provider" IN ('FORTNOX', 'VISMA')
  AND pc."status" IN ('CONNECTED', 'EXPIRED')
  AND pc."disconnectedAt" IS NULL;

INSERT INTO "AccountMapping" ("id", "organizationId", "connectionId", "purpose", "entityTypeId", "providerAccount", "updatedAt")
SELECT gen_random_uuid()::text, pc."organizationId", pc."id", 'REVENUE_DEFAULT', NULL,
       COALESCE(
         (SELECT r."account" FROM "RevenueAccount" r
           WHERE r."organizationId" = pc."organizationId" AND r."isDefault" LIMIT 1),
         s."revenueAccount", '3001'),
       CURRENT_TIMESTAMP
FROM "ProviderConnection" pc
LEFT JOIN "AccountingSettings" s ON s."organizationId" = pc."organizationId"
WHERE pc."provider" IN ('FORTNOX', 'VISMA')
  AND pc."status" IN ('CONNECTED', 'EXPIRED')
  AND pc."disconnectedAt" IS NULL;

INSERT INTO "AccountMapping" ("id", "organizationId", "connectionId", "purpose", "entityTypeId", "providerAccount", "updatedAt")
SELECT gen_random_uuid()::text, pc."organizationId", pc."id", 'ENTITY_TYPE', r."entityTypeId", r."account", CURRENT_TIMESTAMP
FROM "ProviderConnection" pc
JOIN "RevenueAccount" r ON r."organizationId" = pc."organizationId" AND r."entityTypeId" IS NOT NULL
WHERE pc."provider" IN ('FORTNOX', 'VISMA')
  AND pc."status" IN ('CONNECTED', 'EXPIRED')
  AND pc."disconnectedAt" IS NULL;
