-- The payment operator an organization chooses for card payments (ADR 0090); null = the connected one.
CREATE TYPE "PaymentOperator" AS ENUM ('STRIPE');

ALTER TABLE "PaymentSettings" ADD COLUMN "paymentOperator" "PaymentOperator";
