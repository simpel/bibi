-- AlterTable
ALTER TABLE "BookingSeries" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancellationReason" TEXT;
