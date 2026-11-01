-- Free status movement by default and gates on the target (ADR 0076): a status either lets a
-- ticket move to any status or lists the statuses it may move to, and a gate belongs to the
-- target status with an optional source.

-- AlterTable
ALTER TABLE "TicketStatus" ADD COLUMN     "restrictsNext" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TicketStatusGate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "toStatusId" TEXT NOT NULL,
    "fromStatusId" TEXT,
    "key" "TransitionGate" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketStatusGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketStatusGate_organizationId_toStatusId_idx" ON "TicketStatusGate"("organizationId", "toStatusId");

-- A source is either one status or any (null); the same check is never listed twice.
CREATE UNIQUE INDEX "TicketStatusGate_toStatusId_fromStatusId_key_key" ON "TicketStatusGate"("toStatusId", "fromStatusId", "key") NULLS NOT DISTINCT;

-- AddForeignKey
ALTER TABLE "TicketStatusGate" ADD CONSTRAINT "TicketStatusGate_toStatusId_organizationId_fkey" FOREIGN KEY ("toStatusId", "organizationId") REFERENCES "TicketStatus"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketStatusGate" ADD CONSTRAINT "TicketStatusGate_fromStatusId_organizationId_fkey" FOREIGN KEY ("fromStatusId", "organizationId") REFERENCES "TicketStatus"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every gate keeps its move: a gate on from → to becomes a gate into `to` from `from`.
INSERT INTO "TicketStatusGate" ("id", "organizationId", "toStatusId", "fromStatusId", "key", "updatedAt", "createdBy")
SELECT gen_random_uuid()::text, g."organizationId", t."toStatusId", t."fromStatusId", g."key", CURRENT_TIMESTAMP, 'system'
FROM "TicketStatusTransitionGate" g
JOIN "TicketStatusTransition" t ON t."id" = g."transitionId" AND t."organizationId" = g."organizationId";

-- A status whose transitions already list every other active status is free; the others keep
-- their list. A closing status has no moves out and stays free.
UPDATE "TicketStatus" s
SET "restrictsNext" = true
WHERE s."closes" = false
  AND s."status" = 'ACTIVE'
  AND (
    SELECT count(*) FROM "TicketStatusTransition" t
    JOIN "TicketStatus" target ON target."id" = t."toStatusId" AND target."organizationId" = t."organizationId"
    WHERE t."fromStatusId" = s."id" AND target."status" = 'ACTIVE'
  ) < (
    SELECT count(*) FROM "TicketStatus" other
    WHERE other."organizationId" = s."organizationId" AND other."status" = 'ACTIVE' AND other."id" <> s."id"
  );

-- A free status keeps no list: the flag is the single source of what it allows.
DELETE FROM "TicketStatusTransition" t
USING "TicketStatus" s
WHERE s."id" = t."fromStatusId" AND s."organizationId" = t."organizationId" AND s."restrictsNext" = false;

-- DropTable
DROP TABLE "TicketStatusTransitionGate";
