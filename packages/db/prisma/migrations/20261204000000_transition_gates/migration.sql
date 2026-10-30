-- Gates on transitions replace the status guard flags (ADR 0067 §5, #447): a status is just a
-- status, and each move's checks live on the transition.

-- CreateEnum
CREATE TYPE "TransitionGate" AS ENUM ('REASON', 'ASSIGNEE', 'ACCEPTED_QUOTE');

-- CreateTable
CREATE TABLE "TicketStatusTransitionGate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "key" "TransitionGate" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketStatusTransitionGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketStatusTransitionGate_organizationId_transitionId_idx" ON "TicketStatusTransitionGate"("organizationId", "transitionId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketStatusTransitionGate_transitionId_key_key" ON "TicketStatusTransitionGate"("transitionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "TicketStatusTransition_id_organizationId_key" ON "TicketStatusTransition"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "TicketStatusTransitionGate" ADD CONSTRAINT "TicketStatusTransitionGate_transitionId_organizationId_fkey" FOREIGN KEY ("transitionId", "organizationId") REFERENCES "TicketStatusTransition"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Each flag becomes a gate on every transition into the status, so every move keeps its checks.
INSERT INTO "TicketStatusTransitionGate" ("id", "organizationId", "transitionId", "key", "updatedAt", "createdBy")
SELECT gen_random_uuid()::text, t."organizationId", t."id", g."key"::"TransitionGate", CURRENT_TIMESTAMP, 'system'
FROM "TicketStatusTransition" t
JOIN "TicketStatus" s ON s."id" = t."toStatusId" AND s."organizationId" = t."organizationId"
CROSS JOIN LATERAL (
    SELECT 'REASON' AS "key" WHERE s."requiresReason"
    UNION ALL SELECT 'ASSIGNEE' WHERE s."requiresAssignee"
    UNION ALL SELECT 'ACCEPTED_QUOTE' WHERE s."requiresAcceptedQuote"
) g;

-- AlterTable
ALTER TABLE "TicketStatus" DROP COLUMN "requiresAcceptedQuote",
DROP COLUMN "requiresAssignee",
DROP COLUMN "requiresReason";
