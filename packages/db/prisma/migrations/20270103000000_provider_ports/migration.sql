-- ADR 0100: payment providers as ports. One provider enum, one connection table, payment
-- attempts, routing by method, refund rows with a status, credit notes, and generic event
-- receipts and stream offsets. Existing data is copied over before the old shapes are dropped.

-- Enums --------------------------------------------------------------------------------------
CREATE TYPE "Provider" AS ENUM ('STRIPE', 'FORTNOX', 'SWISH', 'VISMA');
CREATE TYPE "ProviderConnectionStatus" AS ENUM ('PENDING', 'ONBOARDING', 'CONNECTED', 'RESTRICTED', 'EXPIRED', 'DISCONNECTED');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "CreditNoteStatus" AS ENUM ('PENDING', 'ISSUED', 'FAILED');

-- New values are not used below, so they may be added in this transaction.
ALTER TYPE "PaymentMethod" ADD VALUE 'SWISH';
ALTER TYPE "PaymentMethod" ADD VALUE 'MANUAL';

-- ProviderConnection: IntegrationConnection (Fortnox) and PaymentAccount (Stripe) merged --------
CREATE TABLE "ProviderConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "status" "ProviderConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "externalAccountId" TEXT,
    "scope" TEXT,
    "accessTokenSealed" TEXT,
    "refreshTokenSealed" TEXT,
    "credentialsSealed" TEXT,
    "accessExpiresAt" TIMESTAMP(3),
    "refreshExpiresAt" TIMESTAMP(3),
    "refreshClaimedAt" TIMESTAMP(3),
    "oauthStateHash" TEXT,
    "codeVerifierSealed" TEXT,
    "oauthStartedAt" TIMESTAMP(3),
    "externalCompanyName" TEXT,
    "externalOrgNumber" TEXT,
    "externalTenantId" TEXT,
    "disconnectedAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "connectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ProviderConnection_pkey" PRIMARY KEY ("id")
);

-- Fortnox rows keep their ids; the Topics tenant id becomes the external account id.
INSERT INTO "ProviderConnection" (
    "id", "organizationId", "provider", "status", "externalAccountId", "scope",
    "accessTokenSealed", "refreshTokenSealed", "accessExpiresAt", "refreshExpiresAt",
    "refreshClaimedAt", "oauthStateHash", "codeVerifierSealed", "oauthStartedAt",
    "externalCompanyName", "externalOrgNumber", "externalTenantId", "disconnectedAt",
    "connectedAt", "connectedBy", "createdAt", "updatedAt", "createdBy")
SELECT
    "id", "organizationId", "provider"::text::"Provider", "status"::text::"ProviderConnectionStatus",
    "fortnoxTenantId"::text, "scope", "accessTokenSealed", "refreshTokenSealed", "accessExpiresAt",
    "refreshExpiresAt", "refreshClaimedAt", "oauthStateHash", "codeVerifierSealed", "oauthStartedAt",
    "externalCompanyName", "externalOrgNumber", "externalTenantId", NULL,
    "connectedAt", "connectedBy", "createdAt", "updatedAt", "createdBy"
FROM "IntegrationConnection";

-- Stripe accounts keep their ids; the status keeps mirroring Stripe and the disconnect flag stays.
INSERT INTO "ProviderConnection" (
    "id", "organizationId", "provider", "status", "externalAccountId", "disconnectedAt",
    "createdAt", "updatedAt", "createdBy")
SELECT
    "id", "organizationId", 'STRIPE',
    CASE "status"::text
        WHEN 'ACTIVE' THEN 'CONNECTED'::"ProviderConnectionStatus"
        WHEN 'RESTRICTED' THEN 'RESTRICTED'::"ProviderConnectionStatus"
        ELSE 'ONBOARDING'::"ProviderConnectionStatus"
    END,
    "stripeAccountId", "disconnectedAt", "createdAt", "updatedAt", "createdBy"
FROM "PaymentAccount";

CREATE INDEX "ProviderConnection_provider_status_refreshExpiresAt_idx" ON "ProviderConnection"("provider", "status", "refreshExpiresAt");
CREATE UNIQUE INDEX "ProviderConnection_id_organizationId_key" ON "ProviderConnection"("id", "organizationId");
CREATE UNIQUE INDEX "ProviderConnection_organizationId_provider_key" ON "ProviderConnection"("organizationId", "provider");
CREATE UNIQUE INDEX "ProviderConnection_provider_externalAccountId_key" ON "ProviderConnection"("provider", "externalAccountId");

-- Payment: provider enum, connection FK; references and links move to PaymentAttempt ------------
ALTER TABLE "Payment" ADD COLUMN "connectionId" TEXT;
UPDATE "Payment" AS p SET "connectionId" = c."id"
FROM "ProviderConnection" AS c
WHERE c."provider" = 'STRIPE' AND c."organizationId" = p."organizationId"
  AND c."externalAccountId" = p."providerAccountId";

ALTER TABLE "Payment" ALTER COLUMN "provider" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "provider" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "provider" TYPE "Provider" USING "provider"::text::"Provider";

CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "provider" "Provider" NOT NULL,
    "connectionId" TEXT,
    "providerReference" TEXT,
    "url" TEXT,
    "qrToken" TEXT,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- One attempt per payment the provider already knew; the payment's id is reused as the attempt's.
INSERT INTO "PaymentAttempt" (
    "id", "organizationId", "paymentId", "method", "provider", "connectionId",
    "providerReference", "url", "status", "expiresAt", "createdAt", "updatedAt", "createdBy")
SELECT
    "id", "organizationId", "id", "method", COALESCE("provider", 'STRIPE'), "connectionId",
    "providerReference", "paymentUrl",
    CASE "status"::text
        WHEN 'SUCCEEDED' THEN 'SUCCEEDED'::"PaymentAttemptStatus"
        WHEN 'REFUNDED' THEN 'SUCCEEDED'::"PaymentAttemptStatus"
        WHEN 'FAILED' THEN 'FAILED'::"PaymentAttemptStatus"
        WHEN 'CANCELLED' THEN 'CANCELLED'::"PaymentAttemptStatus"
        ELSE 'PENDING'::"PaymentAttemptStatus"
    END,
    "expiresAt", "createdAt", "updatedAt", "createdBy"
FROM "Payment"
WHERE "providerReference" IS NOT NULL;

CREATE INDEX "PaymentAttempt_organizationId_paymentId_idx" ON "PaymentAttempt"("organizationId", "paymentId");
CREATE INDEX "PaymentAttempt_organizationId_connectionId_idx" ON "PaymentAttempt"("organizationId", "connectionId");
CREATE UNIQUE INDEX "PaymentAttempt_id_organizationId_key" ON "PaymentAttempt"("id", "organizationId");
CREATE UNIQUE INDEX "PaymentAttempt_provider_providerReference_key" ON "PaymentAttempt"("provider", "providerReference");

DROP INDEX "Payment_providerReference_key";
ALTER TABLE "Payment" DROP COLUMN "expiresAt",
DROP COLUMN "paymentUrl",
DROP COLUMN "providerAccountId",
DROP COLUMN "providerReference";
CREATE INDEX "Payment_organizationId_connectionId_idx" ON "Payment"("organizationId", "connectionId");

-- PaymentRefund: one row per refund already; existing rows were reported by Stripe -------------
ALTER TABLE "PaymentRefund" ADD COLUMN "initiatedBy" TEXT,
ADD COLUMN "providerReference" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "status" "PaymentRefundStatus" NOT NULL DEFAULT 'SUCCEEDED';
-- Steps from the cumulative totals, in case a row ever disagrees with its predecessor.
UPDATE "PaymentRefund" AS r SET "amountMinor" = s."step"
FROM (
    SELECT "id", "refundedTotalMinor" - COALESCE(
        LAG("refundedTotalMinor") OVER (PARTITION BY "paymentId" ORDER BY "refundedTotalMinor", "refundedAt"), 0
    ) AS "step"
    FROM "PaymentRefund"
) AS s
WHERE s."id" = r."id" AND r."amountMinor" <> s."step";
CREATE UNIQUE INDEX "PaymentRefund_paymentId_providerReference_key" ON "PaymentRefund"("paymentId", "providerReference");

-- Invoice: provider enum, connection FK, provider URL ------------------------------------------
ALTER TABLE "Invoice" ADD COLUMN "connectionId" TEXT, ADD COLUMN "providerUrl" TEXT;
ALTER TABLE "Invoice" ALTER COLUMN "provider" TYPE "Provider" USING "provider"::text::"Provider";
UPDATE "Invoice" AS i SET "connectionId" = c."id"
FROM "ProviderConnection" AS c
WHERE i."provider" IS NOT NULL AND c."provider" = i."provider" AND c."organizationId" = i."organizationId";
CREATE UNIQUE INDEX "Invoice_connectionId_providerReference_key" ON "Invoice"("connectionId", "providerReference");

-- PaymentMethodRoute: the two settings become route rows ---------------------------------------
CREATE TABLE "PaymentMethodRoute" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "provider" "Provider" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PaymentMethodRoute_pkey" PRIMARY KEY ("id")
);
INSERT INTO "PaymentMethodRoute" ("id", "organizationId", "method", "provider", "createdAt", "updatedAt", "createdBy")
SELECT 'route_card_' || "id", "organizationId", 'CARD', "paymentOperator"::text::"Provider", "createdAt", "updatedAt", "createdBy"
FROM "PaymentSettings" WHERE "paymentOperator" IS NOT NULL;
INSERT INTO "PaymentMethodRoute" ("id", "organizationId", "method", "provider", "createdAt", "updatedAt", "createdBy")
SELECT 'route_invoice_' || "id", "organizationId", 'INVOICE', "invoiceProvider"::text::"Provider", "createdAt", "updatedAt", "createdBy"
FROM "PaymentSettings" WHERE "invoiceProvider" IS NOT NULL;
CREATE UNIQUE INDEX "PaymentMethodRoute_id_organizationId_key" ON "PaymentMethodRoute"("id", "organizationId");
CREATE UNIQUE INDEX "PaymentMethodRoute_organizationId_method_key" ON "PaymentMethodRoute"("organizationId", "method");
ALTER TABLE "PaymentSettings" DROP COLUMN "invoiceProvider", DROP COLUMN "paymentOperator";

-- CreditNote and its frozen lines (ADR 0052) ---------------------------------------------------
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "amountMinor" INTEGER NOT NULL,
    "totalExclVatMinor" INTEGER NOT NULL,
    "totalInclVatMinor" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "provider" "Provider",
    "connectionId" TEXT,
    "providerReference" TEXT,
    "providerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CreditNote_organizationId_invoiceId_idx" ON "CreditNote"("organizationId", "invoiceId");
CREATE UNIQUE INDEX "CreditNote_id_organizationId_key" ON "CreditNote"("id", "organizationId");
CREATE UNIQUE INDEX "CreditNote_organizationId_number_key" ON "CreditNote"("organizationId", "number");
CREATE UNIQUE INDEX "CreditNote_connectionId_providerReference_key" ON "CreditNote"("connectionId", "providerReference");

ALTER TABLE "OrderLine" ADD COLUMN "creditNoteId" TEXT;
CREATE INDEX "OrderLine_organizationId_creditNoteId_idx" ON "OrderLine"("organizationId", "creditNoteId");
-- ADR 0052, 0100: an order line belongs to exactly one quote, invoice or credit note.
ALTER TABLE "OrderLine" DROP CONSTRAINT "OrderLine_one_owner_check";
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_one_owner_check"
  CHECK (num_nonnulls("quoteId", "invoiceId", "creditNoteId") = 1);

-- ProviderEventReceipt: StripeWebhookEvent with a provider -------------------------------------
CREATE TABLE "ProviderEventReceipt" (
    "id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderEventReceipt_pkey" PRIMARY KEY ("id")
);
INSERT INTO "ProviderEventReceipt" ("id", "provider", "eventId", "type", "receivedAt")
SELECT "id", 'STRIPE', "eventId", "type", "receivedAt" FROM "StripeWebhookEvent";
CREATE UNIQUE INDEX "ProviderEventReceipt_provider_eventId_key" ON "ProviderEventReceipt"("provider", "eventId");

-- ProviderStreamOffset: FortnoxTopicOffset keyed by provider and topic -------------------------
CREATE TABLE "ProviderStreamOffset" (
    "provider" "Provider" NOT NULL,
    "topic" TEXT NOT NULL,
    "offset" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderStreamOffset_pkey" PRIMARY KEY ("provider","topic")
);
INSERT INTO "ProviderStreamOffset" ("provider", "topic", "offset", "updatedAt")
SELECT 'FORTNOX', "topic", "offset", "updatedAt" FROM "FortnoxTopicOffset";

-- Foreign keys -----------------------------------------------------------------------------------
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_connectionId_organizationId_fkey" FOREIGN KEY ("connectionId", "organizationId") REFERENCES "ProviderConnection"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentId_organizationId_fkey" FOREIGN KEY ("paymentId", "organizationId") REFERENCES "Payment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_connectionId_organizationId_fkey" FOREIGN KEY ("connectionId", "organizationId") REFERENCES "ProviderConnection"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_creditNoteId_organizationId_fkey" FOREIGN KEY ("creditNoteId", "organizationId") REFERENCES "CreditNote"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_connectionId_organizationId_fkey" FOREIGN KEY ("connectionId", "organizationId") REFERENCES "ProviderConnection"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_organizationId_fkey" FOREIGN KEY ("invoiceId", "organizationId") REFERENCES "Invoice"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_connectionId_organizationId_fkey" FOREIGN KEY ("connectionId", "organizationId") REFERENCES "ProviderConnection"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The old shapes ---------------------------------------------------------------------------------
DROP TABLE "FortnoxTopicOffset";
DROP TABLE "StripeWebhookEvent";
DROP TABLE "IntegrationConnection";
DROP TABLE "PaymentAccount";
DROP TYPE "IntegrationConnectionStatus";
DROP TYPE "IntegrationProvider";
DROP TYPE "InvoiceProvider";
DROP TYPE "PaymentAccountStatus";
DROP TYPE "PaymentOperator";
