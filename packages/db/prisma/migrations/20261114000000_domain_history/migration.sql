-- ADR 0054: phase and line-state history tables; the current values become their projections.
-- CreateEnum
CREATE TYPE "PhaseChangeTrigger" AS ENUM ('MANUAL', 'QUOTE_EVENT', 'TEMPLATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "StateChangeTrigger" AS ENUM ('MANUAL', 'PHASE', 'EXPIRY', 'SYSTEM');

-- AlterTable
ALTER TABLE "Line" DROP COLUMN "heldAt";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "phaseChangedAt",
DROP COLUMN "phaseReason";

-- AlterTable
ALTER TABLE "TicketPhase" ADD COLUMN     "requiresAcceptedQuote" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TicketPhaseChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromPhaseId" TEXT,
    "toPhaseId" TEXT NOT NULL,
    "reason" TEXT,
    "trigger" "PhaseChangeTrigger" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "TicketPhaseChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineStateChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "lineId" TEXT NOT NULL,
    "fromStateId" TEXT,
    "toStateId" TEXT,
    "trigger" "StateChangeTrigger" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "LineStateChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketPhaseChange_organizationId_ticketId_seq_idx" ON "TicketPhaseChange"("organizationId", "ticketId", "seq");

-- CreateIndex
CREATE INDEX "TicketPhaseChange_organizationId_toPhaseId_changedAt_idx" ON "TicketPhaseChange"("organizationId", "toPhaseId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPhaseChange_seq_key" ON "TicketPhaseChange"("seq");

-- CreateIndex
CREATE INDEX "LineStateChange_organizationId_lineId_seq_idx" ON "LineStateChange"("organizationId", "lineId", "seq");

-- CreateIndex
CREATE INDEX "LineStateChange_organizationId_toStateId_changedAt_idx" ON "LineStateChange"("organizationId", "toStateId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LineStateChange_seq_key" ON "LineStateChange"("seq");

-- AddForeignKey
ALTER TABLE "TicketPhaseChange" ADD CONSTRAINT "TicketPhaseChange_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPhaseChange" ADD CONSTRAINT "TicketPhaseChange_fromPhaseId_organizationId_fkey" FOREIGN KEY ("fromPhaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPhaseChange" ADD CONSTRAINT "TicketPhaseChange_toPhaseId_organizationId_fkey" FOREIGN KEY ("toPhaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineStateChange" ADD CONSTRAINT "LineStateChange_lineId_organizationId_fkey" FOREIGN KEY ("lineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineStateChange" ADD CONSTRAINT "LineStateChange_fromStateId_organizationId_fkey" FOREIGN KEY ("fromStateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineStateChange" ADD CONSTRAINT "LineStateChange_toStateId_organizationId_fkey" FOREIGN KEY ("toStateId", "organizationId") REFERENCES "ItemState"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BEGIN packages/db/sql/domain_history.sql
-- Domain history is owned data; the current phase and line state are its projections (ADR 0054).
-- This file is the source of the functions and triggers; the migration `domain_history` applies
-- it verbatim (`packages/db/test/line-holds-sql.test.ts` keeps the two in step).
--
-- Inserting a `TicketPhaseChange` sets `Ticket.phaseId` to its `toPhaseId`; inserting a
-- `LineStateChange` sets `Line.stateId` to its `toStateId`. Both updates fire the line holds
-- triggers (ADR 0053, `sync_line_occupancy.sql`) in the same transaction, so an overlap still
-- fails the whole change with `line_occupancy_conflict`.
--
-- A change is written against the value it was read from: when `from…Id` is no longer the
-- current value (a concurrent change won), the insert fails with the message `history_stale`,
-- which core maps to CONFLICT. The first row of a record (`from…Id` null on a fresh record)
-- confirms the value the record was inserted with.
--
-- Nothing else may change `Ticket.phaseId` or `Line.stateId` after the insert: a guard trigger
-- refuses any update of them outside the projection (`history_projection_only`).

CREATE OR REPLACE FUNCTION history_project_ticket_phase() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_phase text;
BEGIN
  SELECT t."phaseId" INTO current_phase FROM "Ticket" t
   WHERE t."id" = NEW."ticketId" AND t."organizationId" = NEW."organizationId" FOR UPDATE;
  IF NEW."fromPhaseId" IS DISTINCT FROM current_phase
     AND NOT (NEW."fromPhaseId" IS NULL AND current_phase = NEW."toPhaseId") THEN
    RAISE EXCEPTION USING MESSAGE = 'history_stale', DETAIL = NEW."ticketId";
  END IF;
  IF current_phase IS DISTINCT FROM NEW."toPhaseId" THEN
    PERFORM set_config('okazi.history_projection', 'on', true);
    UPDATE "Ticket" SET "phaseId" = NEW."toPhaseId", "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = NEW."ticketId" AND "organizationId" = NEW."organizationId";
    PERFORM set_config('okazi.history_projection', 'off', true);
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_project_line_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_state text;
BEGIN
  SELECT l."stateId" INTO current_state FROM "Line" l
   WHERE l."id" = NEW."lineId" AND l."organizationId" = NEW."organizationId" FOR UPDATE;
  IF NEW."fromStateId" IS DISTINCT FROM current_state
     AND NOT (NEW."fromStateId" IS NULL AND current_state IS NOT DISTINCT FROM NEW."toStateId") THEN
    RAISE EXCEPTION USING MESSAGE = 'history_stale', DETAIL = NEW."lineId";
  END IF;
  IF current_state IS DISTINCT FROM NEW."toStateId" THEN
    PERFORM set_config('okazi.history_projection', 'on', true);
    UPDATE "Line" SET "stateId" = NEW."toStateId", "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = NEW."lineId" AND "organizationId" = NEW."organizationId";
    PERFORM set_config('okazi.history_projection', 'off', true);
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_projection_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('okazi.history_projection', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION USING MESSAGE = 'history_projection_only',
      DETAIL = TG_TABLE_NAME || ' ' || NEW."id";
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS history_ticket_phase ON "TicketPhaseChange";
CREATE TRIGGER history_ticket_phase AFTER INSERT ON "TicketPhaseChange"
  FOR EACH ROW EXECUTE FUNCTION history_project_ticket_phase();

DROP TRIGGER IF EXISTS history_line_state ON "LineStateChange";
CREATE TRIGGER history_line_state AFTER INSERT ON "LineStateChange"
  FOR EACH ROW EXECUTE FUNCTION history_project_line_state();

DROP TRIGGER IF EXISTS history_ticket_phase_guard ON "Ticket";
CREATE TRIGGER history_ticket_phase_guard BEFORE UPDATE ON "Ticket"
  FOR EACH ROW WHEN (OLD."phaseId" IS DISTINCT FROM NEW."phaseId")
  EXECUTE FUNCTION history_projection_only();

DROP TRIGGER IF EXISTS history_line_state_guard ON "Line";
CREATE TRIGGER history_line_state_guard BEFORE UPDATE ON "Line"
  FOR EACH ROW WHEN (OLD."stateId" IS DISTINCT FROM NEW."stateId")
  EXECUTE FUNCTION history_projection_only();
-- END packages/db/sql/domain_history.sql
