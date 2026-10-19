-- ADR 0053: line holds become a projection written only by database triggers.

-- Line holds and their buffers are derived again below; manual blocks stay.
DELETE FROM "Occupancy" WHERE "type" IN ('HOLD', 'SETUP');

-- DropIndex
DROP INDEX "Occupancy_organizationId_sourceType_sourceId_idx";

-- AlterTable
ALTER TABLE "Occupancy" DROP COLUMN "sourceId",
DROP COLUMN "sourceType",
ADD COLUMN     "lineId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Occupancy_lineId_type_key" ON "Occupancy"("lineId", "type");

-- AddForeignKey
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_lineId_organizationId_fkey" FOREIGN KEY ("lineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Line holds have a line, manual blocks have none.
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_line_check" CHECK (("type" IN ('HOLD', 'SETUP')) = ("lineId" IS NOT NULL));

-- BEGIN packages/db/sql/sync_line_occupancy.sql
-- Line holds are a projection of line state (ADR 0053). This file is the source of the
-- functions and triggers; the migration `line_holds_projection` applies it verbatim
-- (`packages/db/test/line-holds-sql.test.ts` keeps the two in step).
--
-- A line holds its item when: the line and its ticket are ACTIVE, the ticket's phase is not
-- terminal, the line is timed, its item's type is BOOKABLE and its state is not released and
-- holds (SOFT or HARD). It then has one HOLD row of the state's kind for [startsAt, endsAt) and,
-- for a HARD hold whose setup has a changeover time, one SETUP row right before. Rows that no
-- longer hold are ARCHIVED; one row per (lineId, type) is kept and reactivated in place.
--
-- An overlap rejected by "Occupancy_no_overlap" is raised again as SQLSTATE 23P01 with the
-- message `line_occupancy_conflict` and the conflicting line ids, comma separated, in DETAIL.
-- Core maps it to CONFLICT with one issue per line (`lines.<id>`).

CREATE OR REPLACE FUNCTION sync_line_occupancy_row(target_line_id text, kind "OccupancyType",
  hold "HoldKind", starts_at timestamp(3), ends_at timestamp(3))
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF starts_at IS NULL THEN
    UPDATE "Occupancy" SET "status" = 'ARCHIVED', "updatedAt" = (now() AT TIME ZONE 'UTC')
     WHERE "lineId" = target_line_id AND "type" = kind AND "status" <> 'ARCHIVED';
    RETURN;
  END IF;
  INSERT INTO "Occupancy" ("id", "organizationId", "itemId", "type", "holdKind", "startsAt",
    "endsAt", "lineId", "status", "createdAt", "updatedAt", "createdBy")
  SELECT gen_random_uuid()::text, l."organizationId", l."itemId", kind, hold, starts_at, ends_at,
    l."id", 'ACTIVE', now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC', l."createdBy"
    FROM "Line" l WHERE l."id" = target_line_id
  ON CONFLICT ("lineId", "type") DO UPDATE
    SET "itemId" = EXCLUDED."itemId", "holdKind" = EXCLUDED."holdKind",
        "startsAt" = EXCLUDED."startsAt", "endsAt" = EXCLUDED."endsAt",
        "status" = 'ACTIVE', "updatedAt" = (now() AT TIME ZONE 'UTC')
    WHERE ("Occupancy"."itemId", "Occupancy"."holdKind", "Occupancy"."startsAt",
           "Occupancy"."endsAt", "Occupancy"."status")
      IS DISTINCT FROM
          (EXCLUDED."itemId", EXCLUDED."holdKind", EXCLUDED."startsAt", EXCLUDED."endsAt",
           'ACTIVE'::"RecordStatus");
END $$;

-- Derives one line's HOLD and SETUP rows from the line, its ticket, phase, item type, state and
-- setup. Raises `line_occupancy_conflict` with the line id on an overlap.
CREATE OR REPLACE FUNCTION sync_line_occupancy(target_line_id text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  held record;
  hold_kind "HoldKind";
  changeover integer;
BEGIN
  SELECT l."startsAt", l."endsAt", s."hold", COALESCE(su."changeoverMinutes", 0) AS minutes
    INTO held
    FROM "Line" l
    JOIN "Ticket" t ON t."id" = l."ticketId" AND t."organizationId" = l."organizationId"
    JOIN "TicketPhase" p ON p."id" = t."phaseId" AND p."organizationId" = t."organizationId"
    JOIN "Item" i ON i."id" = l."itemId" AND i."organizationId" = l."organizationId"
    JOIN "EntityType" et ON et."id" = i."entityTypeId" AND et."organizationId" = i."organizationId"
    JOIN "ItemState" s ON s."id" = l."stateId" AND s."organizationId" = l."organizationId"
    LEFT JOIN "Setup" su ON su."id" = l."setupId" AND su."organizationId" = l."organizationId"
   WHERE l."id" = target_line_id
     AND l."status" = 'ACTIVE' AND t."status" = 'ACTIVE' AND NOT p."terminal"
     AND l."startsAt" IS NOT NULL AND l."endsAt" IS NOT NULL
     AND 'BOOKABLE' = ANY (et."behaviours")
     AND NOT s."released" AND s."hold" <> 'NONE';
  hold_kind := CASE WHEN FOUND THEN held."hold" ELSE NULL END;
  changeover := CASE WHEN hold_kind = 'HARD' THEN held.minutes ELSE 0 END;
  -- The buffer goes first unless it stays exactly as it is, so a line moving its own rows never
  -- collides with its own old buffer.
  IF NOT EXISTS (
    SELECT 1 FROM "Occupancy" o
     WHERE o."lineId" = target_line_id AND o."type" = 'SETUP' AND o."status" = 'ACTIVE'
       AND changeover > 0 AND o."endsAt" = held."startsAt"
       AND o."startsAt" = held."startsAt" - make_interval(mins => changeover)
  ) THEN
    PERFORM sync_line_occupancy_row(target_line_id, 'SETUP', NULL, NULL, NULL);
  END IF;
  PERFORM sync_line_occupancy_row(target_line_id, 'HOLD', hold_kind,
    CASE WHEN hold_kind IS NULL THEN NULL ELSE held."startsAt" END, held."endsAt");
  IF changeover > 0 THEN
    PERFORM sync_line_occupancy_row(target_line_id, 'SETUP', NULL,
      held."startsAt" - make_interval(mins => changeover), held."startsAt");
  END IF;
EXCEPTION WHEN exclusion_violation THEN
  RAISE EXCEPTION USING ERRCODE = 'exclusion_violation', MESSAGE = 'line_occupancy_conflict',
    DETAIL = target_line_id;
END $$;

-- Re-derives a set of lines and collects every line that collides, so a configuration change
-- (state flags, changeover time, behaviours, terminal flag) is refused with all of them listed.
CREATE OR REPLACE FUNCTION sync_line_occupancies(line_ids text[])
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  line_id text;
  conflicts text[] := '{}';
BEGIN
  FOREACH line_id IN ARRAY COALESCE(line_ids, '{}') LOOP
    BEGIN
      PERFORM sync_line_occupancy(line_id);
    EXCEPTION WHEN exclusion_violation THEN
      conflicts := conflicts || line_id;
    END;
  END LOOP;
  IF cardinality(conflicts) > 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'exclusion_violation', MESSAGE = 'line_occupancy_conflict',
      DETAIL = array_to_string(conflicts, ',');
  END IF;
END $$;

-- Only lines that have not ended are re-derived by configuration changes (ADR 0053, rule 8):
-- the past calendar is frozen. Untimed lines hold nothing and are included so they stay empty.
CREATE OR REPLACE FUNCTION line_not_ended(ends_at timestamp(3))
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT ends_at IS NULL OR ends_at > (now() AT TIME ZONE 'UTC')
$$;

CREATE OR REPLACE FUNCTION line_occupancy_on_line() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancy(NEW."id");
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_item_state() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."stateId" = NEW."id" AND l."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_setup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."setupId" = NEW."id" AND l."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_entity_type() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
      JOIN "Item" i ON i."id" = l."itemId" AND i."organizationId" = l."organizationId"
     WHERE i."entityTypeId" = NEW."id" AND i."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_ticket() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."ticketId" = NEW."id" AND l."organizationId" = NEW."organizationId"
     ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_ticket_phase() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
      JOIN "Ticket" t ON t."id" = l."ticketId" AND t."organizationId" = l."organizationId"
     WHERE t."phaseId" = NEW."id" AND t."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS line_occupancy_insert ON "Line";
CREATE TRIGGER line_occupancy_insert AFTER INSERT ON "Line"
  FOR EACH ROW EXECUTE FUNCTION line_occupancy_on_line();

DROP TRIGGER IF EXISTS line_occupancy_update ON "Line";
CREATE TRIGGER line_occupancy_update AFTER UPDATE ON "Line"
  FOR EACH ROW WHEN (
    (OLD."itemId", OLD."setupId", OLD."startsAt", OLD."endsAt", OLD."stateId", OLD."ticketId",
     OLD."status")
    IS DISTINCT FROM
    (NEW."itemId", NEW."setupId", NEW."startsAt", NEW."endsAt", NEW."stateId", NEW."ticketId",
     NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_line();

DROP TRIGGER IF EXISTS line_occupancy_item_state ON "ItemState";
CREATE TRIGGER line_occupancy_item_state AFTER UPDATE ON "ItemState"
  FOR EACH ROW WHEN ((OLD."hold", OLD."released") IS DISTINCT FROM (NEW."hold", NEW."released"))
  EXECUTE FUNCTION line_occupancy_on_item_state();

DROP TRIGGER IF EXISTS line_occupancy_setup ON "Setup";
CREATE TRIGGER line_occupancy_setup AFTER UPDATE ON "Setup"
  FOR EACH ROW WHEN (OLD."changeoverMinutes" IS DISTINCT FROM NEW."changeoverMinutes")
  EXECUTE FUNCTION line_occupancy_on_setup();

DROP TRIGGER IF EXISTS line_occupancy_entity_type ON "EntityType";
CREATE TRIGGER line_occupancy_entity_type AFTER UPDATE ON "EntityType"
  FOR EACH ROW WHEN (OLD."behaviours" IS DISTINCT FROM NEW."behaviours")
  EXECUTE FUNCTION line_occupancy_on_entity_type();

DROP TRIGGER IF EXISTS line_occupancy_ticket ON "Ticket";
CREATE TRIGGER line_occupancy_ticket AFTER UPDATE ON "Ticket"
  FOR EACH ROW WHEN ((OLD."phaseId", OLD."status") IS DISTINCT FROM (NEW."phaseId", NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_ticket();

DROP TRIGGER IF EXISTS line_occupancy_ticket_phase ON "TicketPhase";
CREATE TRIGGER line_occupancy_ticket_phase AFTER UPDATE ON "TicketPhase"
  FOR EACH ROW WHEN (OLD."terminal" IS DISTINCT FROM NEW."terminal")
  EXECUTE FUNCTION line_occupancy_on_ticket_phase();
-- END packages/db/sql/sync_line_occupancy.sql

-- Derive the holds of every existing line.
SELECT sync_line_occupancy("id") FROM "Line";
