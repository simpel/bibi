-- A status mapping's board is always its phase's board (ADR 0067): the foreign key to the phase
-- goes through the board, so one-phase-per-status-per-board cannot be sidestepped.
-- CreateIndex
CREATE UNIQUE INDEX "BoardPhase_id_boardId_organizationId_key" ON "BoardPhase"("id", "boardId", "organizationId");

-- DropForeignKey
ALTER TABLE "BoardPhaseStatus" DROP CONSTRAINT "BoardPhaseStatus_phaseId_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "BoardPhaseStatus" ADD CONSTRAINT "BoardPhaseStatus_phaseId_boardId_organizationId_fkey" FOREIGN KEY ("phaseId", "boardId", "organizationId") REFERENCES "BoardPhase"("id", "boardId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
