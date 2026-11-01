-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "intakeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_organizationId_intakeKey_key" ON "Ticket"("organizationId", "intakeKey");
