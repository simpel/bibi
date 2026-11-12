-- ADR 0106: the accounting system numbers every invoice and credit note; Bibi numbers nothing.
-- Expand step: the columns become optional and new rows leave them empty. A later release drops
-- them once no running code reads them.
ALTER TABLE "Invoice" ALTER COLUMN "number" DROP NOT NULL;
ALTER TABLE "CreditNote" ALTER COLUMN "number" DROP NOT NULL;
