-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "alternativeGroupId" TEXT;

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "alternativeGroupChosen" BOOLEAN,
ADD COLUMN     "alternativeGroupId" TEXT,
ADD COLUMN     "alternativeGroupName" TEXT,
ADD COLUMN     "inTotal" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AlternativeGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chosenLineId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AlternativeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlternativeGroup_organizationId_status_idx" ON "AlternativeGroup"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AlternativeGroup_organizationId_ticketId_idx" ON "AlternativeGroup"("organizationId", "ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativeGroup_id_organizationId_key" ON "AlternativeGroup"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Line_organizationId_alternativeGroupId_idx" ON "Line"("organizationId", "alternativeGroupId");

-- CreateIndex
CREATE INDEX "OrderLine_organizationId_alternativeGroupId_idx" ON "OrderLine"("organizationId", "alternativeGroupId");

-- AddForeignKey
ALTER TABLE "AlternativeGroup" ADD CONSTRAINT "AlternativeGroup_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeGroup" ADD CONSTRAINT "AlternativeGroup_chosenLineId_organizationId_fkey" FOREIGN KEY ("chosenLineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_alternativeGroupId_organizationId_fkey" FOREIGN KEY ("alternativeGroupId", "organizationId") REFERENCES "AlternativeGroup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_alternativeGroupId_organizationId_fkey" FOREIGN KEY ("alternativeGroupId", "organizationId") REFERENCES "AlternativeGroup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
