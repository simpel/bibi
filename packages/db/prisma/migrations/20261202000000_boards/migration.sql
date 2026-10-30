-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "entityTypeId" TEXT,
    "assigneeId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPhase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BoardPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPhaseStatus" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BoardPhaseStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_organizationId_status_position_idx" ON "Board"("organizationId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Board_id_organizationId_key" ON "Board"("id", "organizationId");

-- CreateIndex
CREATE INDEX "BoardPhase_organizationId_boardId_status_position_idx" ON "BoardPhase"("organizationId", "boardId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "BoardPhase_id_organizationId_key" ON "BoardPhase"("id", "organizationId");

-- CreateIndex
CREATE INDEX "BoardPhaseStatus_organizationId_phaseId_idx" ON "BoardPhaseStatus"("organizationId", "phaseId");

-- CreateIndex
CREATE INDEX "BoardPhaseStatus_organizationId_statusId_idx" ON "BoardPhaseStatus"("organizationId", "statusId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardPhaseStatus_boardId_statusId_key" ON "BoardPhaseStatus"("boardId", "statusId");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPhase" ADD CONSTRAINT "BoardPhase_boardId_organizationId_fkey" FOREIGN KEY ("boardId", "organizationId") REFERENCES "Board"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPhaseStatus" ADD CONSTRAINT "BoardPhaseStatus_boardId_organizationId_fkey" FOREIGN KEY ("boardId", "organizationId") REFERENCES "Board"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPhaseStatus" ADD CONSTRAINT "BoardPhaseStatus_phaseId_organizationId_fkey" FOREIGN KEY ("phaseId", "organizationId") REFERENCES "BoardPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPhaseStatus" ADD CONSTRAINT "BoardPhaseStatus_statusId_organizationId_fkey" FOREIGN KEY ("statusId", "organizationId") REFERENCES "TicketStatus"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill (ADR 0067): every organization with active ticket statuses gets one default board,
-- "Pipeline", with one phase per active status, open statuses first and closing statuses last
-- (the board's previous column order).
INSERT INTO "Board" ("id", "organizationId", "name", "position", "updatedAt")
SELECT 'b' || replace(gen_random_uuid()::text, '-', ''), s."organizationId", 'Pipeline', 0, now()
FROM "TicketStatus" s
WHERE s."status" = 'ACTIVE'
GROUP BY s."organizationId";

INSERT INTO "BoardPhase" ("id", "organizationId", "boardId", "name", "color", "position", "updatedAt")
SELECT s."id", s."organizationId", b."id", s."name", s."color",
  (row_number() OVER (PARTITION BY s."organizationId" ORDER BY s."closes", s."position", s."id") - 1)::int,
  now()
FROM "TicketStatus" s
JOIN "Board" b ON b."organizationId" = s."organizationId"
WHERE s."status" = 'ACTIVE';

-- Each backfilled phase reuses its status's id, so the mapping is a plain join.
INSERT INTO "BoardPhaseStatus" ("id", "organizationId", "boardId", "phaseId", "statusId", "updatedAt")
SELECT 'p' || replace(gen_random_uuid()::text, '-', ''), p."organizationId", p."boardId", p."id", p."id", now()
FROM "BoardPhase" p;
