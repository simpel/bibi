-- Contract of ADR 0106 (expand: 20270113000000_documents_numbered_by_provider): Bibi numbers
-- nothing, keeps no books and no longer retries voids at Stripe Invoicing. Runs only after a
-- release that no longer reads these is deployed.

-- The SIE export (ADR 0077) and its entries.
DROP TABLE "AccountingExportEntry";
DROP TABLE "AccountingExport";
DROP TYPE "AccountingSourceKind";

-- Accounts only the SIE export posted to; advances and revenue accounts stay.
ALTER TABLE "AccountingSettings" DROP COLUMN "receivableAccount",
DROP COLUMN "clearingAccount",
DROP COLUMN "feesAccount",
DROP COLUMN "roundingAccount",
DROP COLUMN "vat25Account",
DROP COLUMN "vat12Account",
DROP COLUMN "vat6Account",
DROP COLUMN "fiscalYearStartMonth";

-- Bibi's own document numbers (the unique indexes go with the columns).
ALTER TABLE "Invoice" DROP COLUMN "number",
DROP COLUMN "voidPendingAt";
ALTER TABLE "CreditNote" DROP COLUMN "number";
