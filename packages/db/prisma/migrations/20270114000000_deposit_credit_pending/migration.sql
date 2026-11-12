-- ADR 0100, 0106: a void whose credit of the prepayment invoice the accounting system did not
-- confirm is retried by the refund retry job. Nullable, no backfill.
ALTER TABLE "Deposit" ADD COLUMN "creditPendingAt" TIMESTAMP(3);
