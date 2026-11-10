-- Refunds are derived from PaymentRefund rows (ADR 0057, 0100); Bibi starts refunds, so a row is
-- PENDING until the provider confirms it. Credit notes get accounting export entries.

-- AlterEnum
ALTER TYPE "AccountingSourceKind" ADD VALUE 'CREDIT_NOTE';

-- Payment: the refunded total is the sum of SUCCEEDED refunds; staff note on MANUAL payments.
ALTER TABLE "Payment" DROP COLUMN "refundedMinor",
ADD COLUMN "note" TEXT;

-- PaymentRefund: one row per refund with its own lifecycle; the cumulative total goes.
DROP INDEX "PaymentRefund_paymentId_refundedTotalMinor_key";
ALTER TABLE "PaymentRefund" DROP COLUMN "refundedTotalMinor",
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "refundedAt" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "PaymentRefund" ALTER COLUMN "updatedAt" DROP DEFAULT;
-- A succeeded refund has its date; a pending or failed one may not.
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_succeeded_dated" CHECK (
  "status" <> 'SUCCEEDED' OR "refundedAt" IS NOT NULL
);

-- AccountingExportEntry: a credit note is a source too.
ALTER TABLE "AccountingExportEntry" ADD COLUMN "creditNoteId" TEXT;
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_creditNoteId_organizationId_fkey" FOREIGN KEY ("creditNoteId", "organizationId") REFERENCES "CreditNote"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one source per entry, the one its kind names (ADR 0077, 0100).
ALTER TABLE "AccountingExportEntry" DROP CONSTRAINT "AccountingExportEntry_one_source";
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_one_source" CHECK (
  ("kind" IN ('INVOICE_SENT', 'INVOICE_VOID') AND "invoiceId" IS NOT NULL AND "paymentId" IS NULL AND "refundId" IS NULL AND "creditNoteId" IS NULL)
  OR ("kind" IN ('PAYMENT', 'FEE') AND "paymentId" IS NOT NULL AND "invoiceId" IS NULL AND "refundId" IS NULL AND "creditNoteId" IS NULL)
  OR ("kind" = 'REFUND' AND "refundId" IS NOT NULL AND "invoiceId" IS NULL AND "paymentId" IS NULL AND "creditNoteId" IS NULL)
  OR ("kind"::text = 'CREDIT_NOTE' AND "creditNoteId" IS NOT NULL AND "invoiceId" IS NULL AND "paymentId" IS NULL AND "refundId" IS NULL)
);
