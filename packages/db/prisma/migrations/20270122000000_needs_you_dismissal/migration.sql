-- CreateTable
CREATE TABLE "NeedsYouDismissal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "NeedsYouDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NeedsYouDismissal_orderId_organizationId_idx" ON "NeedsYouDismissal"("orderId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "NeedsYouDismissal_organizationId_userId_taskKey_key" ON "NeedsYouDismissal"("organizationId", "userId", "taskKey");

-- AddForeignKey
ALTER TABLE "NeedsYouDismissal" ADD CONSTRAINT "NeedsYouDismissal_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId") REFERENCES "Order"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
