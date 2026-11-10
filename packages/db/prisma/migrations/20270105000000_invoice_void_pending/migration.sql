-- Owned (ADR 0051, 0100): a void at the provider that ended without an answer.
ALTER TABLE "Invoice" ADD COLUMN "voidPendingAt" TIMESTAMP(3);
