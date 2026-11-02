-- CreateTable
CREATE TABLE "InvoiceDeposit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "InvoiceDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceDeposit_organizationId_depositId_idx" ON "InvoiceDeposit"("organizationId", "depositId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceDeposit_id_organizationId_key" ON "InvoiceDeposit"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceDeposit_invoiceId_depositId_key" ON "InvoiceDeposit"("invoiceId", "depositId");

-- AddForeignKey
ALTER TABLE "InvoiceDeposit" ADD CONSTRAINT "InvoiceDeposit_invoiceId_organizationId_fkey" FOREIGN KEY ("invoiceId", "organizationId") REFERENCES "Invoice"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDeposit" ADD CONSTRAINT "InvoiceDeposit_depositId_organizationId_fkey" FOREIGN KEY ("depositId", "organizationId") REFERENCES "Deposit"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
