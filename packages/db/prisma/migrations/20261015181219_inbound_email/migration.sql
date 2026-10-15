-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerEmailId" TEXT NOT NULL,
    "messageId" TEXT,
    "fromAddress" TEXT NOT NULL,
    "toAddresses" TEXT[],
    "subject" TEXT,
    "text" TEXT,
    "html" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboundEmail_organizationId_bookingId_receivedAt_idx" ON "InboundEmail"("organizationId", "bookingId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_id_organizationId_key" ON "InboundEmail"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_organizationId_providerEmailId_key" ON "InboundEmail"("organizationId", "providerEmailId");

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_bookingId_organizationId_fkey" FOREIGN KEY ("bookingId", "organizationId") REFERENCES "Booking"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
