-- ADR 0052: an order line is a frozen snapshot of a ticket line (`lineId`, required). Order
-- lines written before had no line to point at; there is no production data (re-run seed:demo).
DELETE FROM "OrderLine";

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "lineId" TEXT NOT NULL,
ALTER COLUMN "itemId" DROP NOT NULL,
ALTER COLUMN "discountPercent" SET DEFAULT 0,
ALTER COLUMN "discountPercent" SET DATA TYPE DECIMAL(5,2);

-- CreateIndex
CREATE INDEX "OrderLine_organizationId_lineId_idx" ON "OrderLine"("organizationId", "lineId");

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_lineId_organizationId_fkey" FOREIGN KEY ("lineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
