-- ADR 0106: a deposit sent while a ledger provider takes invoices is raised there as a
-- prepayment invoice. Nullable, no backfill.
ALTER TABLE "Deposit" ADD COLUMN "provider" "Provider";
ALTER TABLE "Deposit" ADD COLUMN "connectionId" TEXT;
ALTER TABLE "Deposit" ADD COLUMN "providerReference" TEXT;
ALTER TABLE "Deposit" ADD COLUMN "providerUrl" TEXT;

CREATE UNIQUE INDEX "Deposit_connectionId_providerReference_key" ON "Deposit"("connectionId", "providerReference");

ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_connectionId_organizationId_fkey" FOREIGN KEY ("connectionId", "organizationId") REFERENCES "ProviderConnection"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
