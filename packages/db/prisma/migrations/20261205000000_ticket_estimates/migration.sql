-- A ticket's value estimates, append-only (ADR 0074): the newest row is the current estimate.

-- CreateTable
CREATE TABLE "TicketEstimate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "valueMinor" INTEGER,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "TicketEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketEstimate_seq_key" ON "TicketEstimate"("seq");

-- CreateIndex
CREATE INDEX "TicketEstimate_organizationId_ticketId_seq_idx" ON "TicketEstimate"("organizationId", "ticketId", "seq");

-- AddForeignKey
ALTER TABLE "TicketEstimate" ADD CONSTRAINT "TicketEstimate_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
