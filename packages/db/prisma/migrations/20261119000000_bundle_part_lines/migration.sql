-- ADR 0059: a part line links to its bundle line; order lines freeze VAT per rate.

-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "parentLineId" TEXT;

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "parentLineId" TEXT,
ADD COLUMN     "vatRows" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "Line_organizationId_parentLineId_idx" ON "Line"("organizationId", "parentLineId");

-- CreateIndex
CREATE INDEX "OrderLine_organizationId_parentLineId_idx" ON "OrderLine"("organizationId", "parentLineId");

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_parentLineId_organizationId_fkey" FOREIGN KEY ("parentLineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_parentLineId_organizationId_fkey" FOREIGN KEY ("parentLineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A line is never its own bundle line.
ALTER TABLE "Line" ADD CONSTRAINT "Line_parentLineId_check" CHECK ("parentLineId" <> "id");
