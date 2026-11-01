-- CreateEnum
CREATE TYPE "AccountingSourceKind" AS ENUM ('INVOICE_SENT', 'INVOICE_VOID', 'PAYMENT', 'FEE', 'REFUND');

-- CreateTable
CREATE TABLE "AccountingExport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileBytes" BYTEA NOT NULL,
    "voucherCount" INTEGER NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AccountingExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingExportEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "exportId" TEXT NOT NULL,
    "kind" "AccountingSourceKind" NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "refundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingExportEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingExport_id_organizationId_key" ON "AccountingExport"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingExport_organizationId_number_key" ON "AccountingExport"("organizationId", "number");

-- CreateIndex
CREATE INDEX "AccountingExportEntry_organizationId_exportId_idx" ON "AccountingExportEntry"("organizationId", "exportId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingExportEntry_kind_invoiceId_key" ON "AccountingExportEntry"("kind", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingExportEntry_kind_paymentId_key" ON "AccountingExportEntry"("kind", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingExportEntry_kind_refundId_key" ON "AccountingExportEntry"("kind", "refundId");

-- AddForeignKey
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_exportId_organizationId_fkey" FOREIGN KEY ("exportId", "organizationId") REFERENCES "AccountingExport"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_invoiceId_organizationId_fkey" FOREIGN KEY ("invoiceId", "organizationId") REFERENCES "Invoice"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_paymentId_organizationId_fkey" FOREIGN KEY ("paymentId", "organizationId") REFERENCES "Payment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_refundId_organizationId_fkey" FOREIGN KEY ("refundId", "organizationId") REFERENCES "PaymentRefund"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one source per entry, the one its kind names (ADR 0077).
ALTER TABLE "AccountingExportEntry" ADD CONSTRAINT "AccountingExportEntry_one_source" CHECK (
  ("kind" IN ('INVOICE_SENT', 'INVOICE_VOID') AND "invoiceId" IS NOT NULL AND "paymentId" IS NULL AND "refundId" IS NULL)
  OR ("kind" IN ('PAYMENT', 'FEE') AND "paymentId" IS NOT NULL AND "invoiceId" IS NULL AND "refundId" IS NULL)
  OR ("kind" = 'REFUND' AND "refundId" IS NOT NULL AND "invoiceId" IS NULL AND "paymentId" IS NULL)
);
