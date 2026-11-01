-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "refundedTotalMinor" INTEGER NOT NULL,
    "refundedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentRefund_organizationId_refundedAt_idx" ON "PaymentRefund"("organizationId", "refundedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_id_organizationId_key" ON "PaymentRefund"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_paymentId_refundedTotalMinor_key" ON "PaymentRefund"("paymentId", "refundedTotalMinor");

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_organizationId_fkey" FOREIGN KEY ("paymentId", "organizationId") REFERENCES "Payment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill (ADR 0077): a SENT row's last status change was its send; a VOID row's was its void.
UPDATE "Invoice" SET "sentAt" = "statusChangedAt" WHERE "status" = 'SENT';
UPDATE "Invoice" SET "voidedAt" = "statusChangedAt" WHERE "status" = 'VOID';
UPDATE "Deposit" SET "sentAt" = "statusChangedAt" WHERE "status" = 'SENT';
UPDATE "Deposit" SET "voidedAt" = "statusChangedAt" WHERE "status" = 'VOID';

-- Existing refunds become one row each, dated when the payment last changed.
INSERT INTO "PaymentRefund" ("id", "organizationId", "paymentId", "amountMinor", "refundedTotalMinor", "refundedAt")
SELECT 'rf' || md5("id"), "organizationId", "id", "refundedMinor", "refundedMinor", "updatedAt"
FROM "Payment" WHERE "refundedMinor" > 0;
