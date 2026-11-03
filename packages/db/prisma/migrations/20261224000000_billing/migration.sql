-- Bibi's own subscription billing (ADR 0091, 0095).
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

CREATE TABLE "BillingConfig" (
    "id" TEXT NOT NULL,
    "secretKeySealed" TEXT,
    "secretKeyHint" TEXT,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "webhookSecretSealed" TEXT,
    "webhookEndpointId" TEXT,
    "productId" TEXT,
    "basePriceMonthlyId" TEXT,
    "basePriceYearlyId" TEXT,
    "seatPriceId" TEXT,
    "portalConfigId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "BillingConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "exempt" BOOLEAN NOT NULL DEFAULT false,
    "autoAssignSeats" BOOLEAN NOT NULL DEFAULT true,
    "extraSeats" INTEGER NOT NULL DEFAULT 0,
    "remindedAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "interval" "BillingInterval",
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BillingAccount_extraSeats_check" CHECK ("extraSeats" >= 0)
);

CREATE UNIQUE INDEX "BillingAccount_organizationId_key" ON "BillingAccount"("organizationId");
CREATE UNIQUE INDEX "BillingAccount_stripeCustomerId_key" ON "BillingAccount"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingAccount_stripeSubscriptionId_key" ON "BillingAccount"("stripeSubscriptionId");
CREATE UNIQUE INDEX "BillingAccount_id_organizationId_key" ON "BillingAccount"("id", "organizationId");
