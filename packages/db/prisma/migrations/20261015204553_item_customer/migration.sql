-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "customerId" TEXT;

-- CreateIndex
CREATE INDEX "Item_organizationId_customerId_idx" ON "Item"("organizationId", "customerId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_customerId_organizationId_fkey" FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
