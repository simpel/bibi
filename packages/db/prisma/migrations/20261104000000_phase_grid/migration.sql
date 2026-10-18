-- CreateTable
CREATE TABLE "PhaseStateRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PhaseStateRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhaseStateRule_organizationId_phaseId_idx" ON "PhaseStateRule"("organizationId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseStateRule_id_organizationId_key" ON "PhaseStateRule"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseStateRule_phaseId_entityTypeId_key" ON "PhaseStateRule"("phaseId", "entityTypeId");

-- AddForeignKey
ALTER TABLE "PhaseStateRule" ADD CONSTRAINT "PhaseStateRule_phaseId_organizationId_fkey" FOREIGN KEY ("phaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseStateRule" ADD CONSTRAINT "PhaseStateRule_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhaseStateRule" ADD CONSTRAINT "PhaseStateRule_stateId_organizationId_fkey" FOREIGN KEY ("stateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
