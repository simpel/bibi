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
    PERFORM set_config('bibi.history_projection', 'on', true);
    UPDATE "Ticket" SET "phaseId" = NEW."toPhaseId", "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = NEW."ticketId" AND "organizationId" = NEW."organizationId";
    PERFORM set_config('bibi.history_projection', 'off', true);
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
    PERFORM set_config('bibi.history_projection', 'on', true);
    UPDATE "Line" SET "stateId" = NEW."toStateId", "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = NEW."lineId" AND "organizationId" = NEW."organizationId";
    PERFORM set_config('bibi.history_projection', 'off', true);
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_projection_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('bibi.history_projection', true) IS DISTINCT FROM 'on' THEN
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
