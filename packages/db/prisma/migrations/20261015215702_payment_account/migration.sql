-- CreateEnum
CREATE TYPE "PaymentAccountStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'RESTRICTED');

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "status" "PaymentAccountStatus" NOT NULL DEFAULT 'ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_id_organizationId_key" ON "PaymentAccount"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_organizationId_key" ON "PaymentAccount"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_stripeAccountId_key" ON "PaymentAccount"("stripeAccountId");
