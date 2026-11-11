-- Business or private (ADR 0106): set on the customer, inherited by its orders unless an order
-- sets its own; and the customer's organisation number.
CREATE TYPE "BuyerKind" AS ENUM ('BUSINESS', 'PRIVATE');

ALTER TABLE "Customer" ADD COLUMN "buyerKind" "BuyerKind" NOT NULL DEFAULT 'BUSINESS';
ALTER TABLE "Customer" ADD COLUMN "organizationNumber" TEXT;

ALTER TABLE "Order" ADD COLUMN "buyerKind" "BuyerKind";
