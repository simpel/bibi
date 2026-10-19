-- ADR 0057: a payment settles exactly one receivable. Payments written before settled nothing;
-- there is no production data (re-run seed:demo).
DELETE FROM "Payment";

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('DRAFT', 'SENT', 'VOID');

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "invoiceId" TEXT,
ALTER COLUMN "quoteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "depositId" TEXT,
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "quoteId" TEXT;

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "dueDate" TIMESTAMP(3),
    "status" "ReceivableStatus" NOT NULL DEFAULT 'DRAFT',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "dueDate" TIMESTAMP(3),
    "status" "ReceivableStatus" NOT NULL DEFAULT 'DRAFT',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalExclVatMinor" INTEGER NOT NULL,
    "totalInclVatMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deposit_organizationId_ticketId_idx" ON "Deposit"("organizationId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_id_organizationId_key" ON "Deposit"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_ticketId_idx" ON "Invoice"("organizationId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_id_organizationId_key" ON "Invoice"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_number_key" ON "Invoice"("organizationId", "number");

-- CreateIndex
CREATE INDEX "OrderLine_organizationId_invoiceId_idx" ON "OrderLine"("organizationId", "invoiceId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_quoteId_idx" ON "Payment"("organizationId", "quoteId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_depositId_idx" ON "Payment"("organizationId", "depositId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_invoiceId_idx" ON "Payment"("organizationId", "invoiceId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_quoteId_organizationId_fkey" FOREIGN KEY ("quoteId", "organizationId") REFERENCES "Quote"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_depositId_organizationId_fkey" FOREIGN KEY ("depositId", "organizationId") REFERENCES "Deposit"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_organizationId_fkey" FOREIGN KEY ("invoiceId", "organizationId") REFERENCES "Invoice"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_invoiceId_organizationId_fkey" FOREIGN KEY ("invoiceId", "organizationId") REFERENCES "Invoice"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ADR 0057: exactly one receivable per payment.
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_one_receivable_check"
  CHECK (num_nonnulls("quoteId", "depositId", "invoiceId") = 1);

-- ADR 0052: an order line belongs to exactly one quote or invoice.
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_one_owner_check"
  CHECK (num_nonnulls("quoteId", "invoiceId") = 1);

-- A fixed amount is never negative.
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_amount_check" CHECK ("amountMinor" > 0);

-- At most one invoice per ticket that is not VOID: a concurrent second create gets CONFLICT.
CREATE UNIQUE INDEX "Invoice_ticketId_open_key" ON "Invoice"("organizationId", "ticketId")
  WHERE "status" <> 'VOID';
