-- DropIndex
DROP INDEX "AccountingExportEntry_kind_invoiceId_key";

-- DropIndex
DROP INDEX "AccountingExportEntry_kind_paymentId_key";

-- DropIndex
DROP INDEX "AccountingExportEntry_kind_refundId_key";

-- AlterTable
ALTER TABLE "AccountingExport" ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3);
