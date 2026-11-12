-- ADR 0105: the buyer's reference on contact and order, the customer's requirement, and the
-- invoice's snapshot. Nullable or defaulted, no backfill.
ALTER TABLE "Contact" ADD COLUMN "buyerReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "buyerReference" TEXT;
ALTER TABLE "Customer" ADD COLUMN "requiresBuyerReference" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN "buyerReference" TEXT;
