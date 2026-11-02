-- AlterTable
ALTER TABLE "IntegrationConnection" ADD COLUMN     "fortnoxTenantId" INTEGER;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "provider" "InvoiceProvider",
ADD COLUMN     "providerReference" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "provider" "InvoiceProvider" NOT NULL DEFAULT 'STRIPE',
ALTER COLUMN "providerAccountId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FortnoxTopicOffset" (
    "topic" TEXT NOT NULL,
    "offset" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FortnoxTopicOffset_pkey" PRIMARY KEY ("topic")
);
