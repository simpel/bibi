-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'INVOICE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "applicationFeeMinor" INTEGER,
    "providerAccountId" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "paymentUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "refundedMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_organizationId_bookingId_idx" ON "Payment"("organizationId", "bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_id_organizationId_key" ON "Payment"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_organizationId_fkey" FOREIGN KEY ("bookingId", "organizationId") REFERENCES "Booking"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
