-- Line holds are a projection of line state (ADR 0053, 0059). This file is the source of the
-- functions and triggers; the latest migration that includes it applies it verbatim
-- (`packages/db/test/line-holds-sql.test.ts` keeps the two in step).
--
-- A line holds its item when: the line and its ticket are ACTIVE, the ticket's status does not
-- close it, the line is timed, its item's type is BOOKABLE and its state is not released and
-- holds (SOFT or HARD). It then has one HOLD row of the state's kind for [startsAt, endsAt), a
-- SETUP row right before and a TEARDOWN row right after, each of the same kind and only when its
-- minutes are above zero. Setup minutes are the line's, else the item's, else the type's, and
-- the larger of that and the setup's changeover time (never the sum); teardown minutes are the
-- line's, else the item's, else the type's. SOFT buffers never block, like SOFT holds.
--
-- A held line also holds the unit of every active, filled allocation (`LineAllocation`) of an
-- active demand whose unit is active and of a BOOKABLE type, for each of the demand's windows
-- that is not empty: SETUP as a SETUP row, BOOKING as a HOLD row and TEARDOWN as a TEARDOWN
-- row, with the line's times and hold kind and the allocation's id. The unit's own buffers do
-- not apply. Rows that no longer hold are ARCHIVED; one row per (lineId, itemId, type) is kept and
-- reactivated.
--
-- An overlap rejected by "Occupancy_no_overlap" is raised again as SQLSTATE 23P01 with the
-- message `line_occupancy_conflict` and the conflicting line ids, comma separated, in DETAIL.
-- Core maps it to CONFLICT with one issue per line (`lines.<id>`).

DROP FUNCTION IF EXISTS sync_line_occupancy_row(text, "OccupancyType", "HoldKind",
  timestamp(3), timestamp(3));
DROP FUNCTION IF EXISTS sync_line_occupancy_row(text, text, "OccupancyType", "HoldKind",
  timestamp(3), timestamp(3));

-- Writes one active line row, reactivating the line's row for the same item and window.
CREATE OR REPLACE FUNCTION sync_line_occupancy_row(target_line_id text, item_id text,
  allocation_id text, kind "OccupancyType", hold "HoldKind", starts_at timestamp(3),
  ends_at timestamp(3))
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "Occupancy" ("id", "organizationId", "itemId", "type", "holdKind", "startsAt",
    "endsAt", "lineId", "allocationId", "status", "createdAt", "updatedAt", "createdBy")
  SELECT gen_random_uuid()::text, l."organizationId", item_id, kind, hold, starts_at, ends_at,
    l."id", allocation_id, 'ACTIVE', now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC',
    l."createdBy"
    FROM "Line" l WHERE l."id" = target_line_id
  ON CONFLICT ("lineId", "itemId", "type") DO UPDATE
    SET "holdKind" = EXCLUDED."holdKind", "startsAt" = EXCLUDED."startsAt",
        "endsAt" = EXCLUDED."endsAt", "allocationId" = EXCLUDED."allocationId",
        "status" = 'ACTIVE', "updatedAt" = (now() AT TIME ZONE 'UTC')
    WHERE ("Occupancy"."holdKind", "Occupancy"."startsAt", "Occupancy"."endsAt",
           "Occupancy"."allocationId", "Occupancy"."status")
      IS DISTINCT FROM
          (EXCLUDED."holdKind", EXCLUDED."startsAt", EXCLUDED."endsAt", EXCLUDED."allocationId",
           'ACTIVE'::"RecordStatus");
END $$;

-- The rows one line should have: its own item's HOLD, SETUP and TEARDOWN, then the windows of
-- its allocated units. Empty when the line holds nothing.
CREATE OR REPLACE FUNCTION line_occupancy_wanted(target_line_id text)
RETURNS TABLE (item_id text, allocation_id text, kind "OccupancyType", hold "HoldKind",
  starts_at timestamp(3), ends_at timestamp(3))
LANGUAGE sql STABLE AS $$
  WITH held AS (
    SELECT l."id", l."organizationId", l."itemId", l."startsAt", l."endsAt", s."hold",
           l."startsAt" - make_interval(mins => GREATEST(
             COALESCE(l."setupMinutes", i."setupMinutes", et."setupMinutes", 0),
             COALESCE(su."changeoverMinutes", 0))) AS setup_from,
           l."endsAt" + make_interval(mins =>
             COALESCE(l."teardownMinutes", i."teardownMinutes", et."teardownMinutes", 0))
             AS teardown_to
      FROM "Line" l
      JOIN "Ticket" t ON t."id" = l."ticketId" AND t."organizationId" = l."organizationId"
      JOIN "TicketStatus" p ON p."id" = t."statusId" AND p."organizationId" = t."organizationId"
      JOIN "Item" i ON i."id" = l."itemId" AND i."organizationId" = l."organizationId"
      JOIN "EntityType" et ON et."id" = i."entityTypeId"
        AND et."organizationId" = i."organizationId"
      JOIN "ItemState" s ON s."id" = l."stateId" AND s."organizationId" = l."organizationId"
      LEFT JOIN "Setup" su ON su."id" = l."setupId" AND su."organizationId" = l."organizationId"
     WHERE l."id" = target_line_id
       AND l."status" = 'ACTIVE' AND t."status" = 'ACTIVE' AND NOT p."closes"
       AND l."startsAt" IS NOT NULL AND l."endsAt" IS NOT NULL
       AND 'BOOKABLE' = ANY (et."capabilities")
       AND NOT s."released" AND s."hold" <> 'NONE'
  ),
  windows AS (
    SELECT h.*, w.kind, w.demand_window, w.starts_at, w.ends_at
      FROM held h
     CROSS JOIN LATERAL (VALUES
       ('SETUP'::"OccupancyType", 'SETUP'::"DemandWindow", h.setup_from, h."startsAt"),
       ('HOLD'::"OccupancyType", 'BOOKING'::"DemandWindow", h."startsAt", h."endsAt"),
       ('TEARDOWN'::"OccupancyType", 'TEARDOWN'::"DemandWindow", h."endsAt", h.teardown_to))
       AS w(kind, demand_window, starts_at, ends_at)
     WHERE w.ends_at > w.starts_at
  )
  SELECT w."itemId", NULL::text, w.kind, w."hold", w.starts_at, w.ends_at FROM windows w
  UNION ALL
  SELECT a."unitId", a."id", w.kind, w."hold", w.starts_at, w.ends_at
    FROM windows w
    JOIN "LineAllocation" a ON a."lineId" = w."id" AND a."organizationId" = w."organizationId"
    JOIN "ItemDemand" d ON d."id" = a."demandId" AND d."organizationId" = a."organizationId"
    JOIN "Item" u ON u."id" = a."unitId" AND u."organizationId" = a."organizationId"
    JOIN "EntityType" ut ON ut."id" = u."entityTypeId" AND ut."organizationId" = u."organizationId"
   WHERE a."status" = 'ACTIVE' AND d."status" = 'ACTIVE' AND u."status" = 'ACTIVE'
     AND a."unitId" <> w."itemId"
     AND 'BOOKABLE' = ANY (ut."capabilities")
     AND w.demand_window = ANY (d."windows")
$$;

-- Derives one line's rows (`line_occupancy_wanted`). Raises `line_occupancy_conflict` with the
-- line id on an overlap.
CREATE OR REPLACE FUNCTION sync_line_occupancy(target_line_id text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  wanted record;
BEGIN
  -- Every row that is not wanted exactly as it is goes first, so a line moving its rows never
  -- collides with its own old rows.
  UPDATE "Occupancy" o SET "status" = 'ARCHIVED', "updatedAt" = (now() AT TIME ZONE 'UTC')
   WHERE o."lineId" = target_line_id AND o."status" <> 'ARCHIVED'
     AND (o."itemId", COALESCE(o."allocationId", ''), o."type", o."holdKind", o."startsAt",
          o."endsAt") NOT IN (
       SELECT w.item_id, COALESCE(w.allocation_id, ''), w.kind, w.hold, w.starts_at, w.ends_at
         FROM line_occupancy_wanted(target_line_id) w);
  FOR wanted IN SELECT * FROM line_occupancy_wanted(target_line_id) LOOP
    PERFORM sync_line_occupancy_row(target_line_id, wanted.item_id, wanted.allocation_id,
      wanted.kind, wanted.hold, wanted.starts_at, wanted.ends_at);
  END LOOP;
EXCEPTION WHEN exclusion_violation THEN
  RAISE EXCEPTION USING ERRCODE = 'exclusion_violation', MESSAGE = 'line_occupancy_conflict',
    DETAIL = target_line_id;
END $$;

-- Re-derives a set of lines and collects every line that collides, so a configuration change
-- (state flags, changeover time, buffer minutes, capabilities, `closes` flag) is refused with all
-- of them listed.
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
     WHERE l."organizationId" = NEW."organizationId" AND line_not_ended(l."endsAt")
       AND (EXISTS (SELECT 1 FROM "Item" i
                     WHERE i."id" = l."itemId" AND i."organizationId" = l."organizationId"
                       AND i."entityTypeId" = NEW."id")
         OR EXISTS (SELECT 1 FROM "LineAllocation" a
                      JOIN "Item" u ON u."id" = a."unitId"
                        AND u."organizationId" = a."organizationId"
                     WHERE a."lineId" = l."id" AND a."organizationId" = l."organizationId"
                       AND a."status" = 'ACTIVE' AND u."entityTypeId" = NEW."id"))
     ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_item() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."itemId" = NEW."id" AND l."organizationId" = NEW."organizationId"
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

CREATE OR REPLACE FUNCTION line_occupancy_on_ticket_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
      JOIN "Ticket" t ON t."id" = l."ticketId" AND t."organizationId" = l."organizationId"
     WHERE t."statusId" = NEW."id" AND t."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

-- A line's allocation filled, changed or removed: the line's holds follow.
CREATE OR REPLACE FUNCTION line_occupancy_on_allocation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY[NEW."lineId"]);
  RETURN NULL;
END $$;

-- A demand's windows changed or it was archived: the lines with its allocations that have not
-- ended follow.
CREATE OR REPLACE FUNCTION line_occupancy_on_item_demand() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT DISTINCT l."id" FROM "Line" l
      JOIN "LineAllocation" a ON a."lineId" = l."id" AND a."organizationId" = l."organizationId"
     WHERE a."demandId" = NEW."id" AND a."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS line_occupancy_insert ON "Line";
CREATE TRIGGER line_occupancy_insert AFTER INSERT ON "Line"
  FOR EACH ROW EXECUTE FUNCTION line_occupancy_on_line();

DROP TRIGGER IF EXISTS line_occupancy_update ON "Line";
CREATE TRIGGER line_occupancy_update AFTER UPDATE ON "Line"
  FOR EACH ROW WHEN (
    (OLD."itemId", OLD."setupId", OLD."setupMinutes", OLD."teardownMinutes", OLD."startsAt",
     OLD."endsAt", OLD."stateId", OLD."ticketId", OLD."status")
    IS DISTINCT FROM
    (NEW."itemId", NEW."setupId", NEW."setupMinutes", NEW."teardownMinutes", NEW."startsAt",
     NEW."endsAt", NEW."stateId", NEW."ticketId", NEW."status"))
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
  FOR EACH ROW WHEN (
    (OLD."capabilities", OLD."setupMinutes", OLD."teardownMinutes")
    IS DISTINCT FROM (NEW."capabilities", NEW."setupMinutes", NEW."teardownMinutes"))
  EXECUTE FUNCTION line_occupancy_on_entity_type();

DROP TRIGGER IF EXISTS line_occupancy_item ON "Item";
CREATE TRIGGER line_occupancy_item AFTER UPDATE ON "Item"
  FOR EACH ROW WHEN (
    (OLD."setupMinutes", OLD."teardownMinutes")
    IS DISTINCT FROM (NEW."setupMinutes", NEW."teardownMinutes"))
  EXECUTE FUNCTION line_occupancy_on_item();

DROP TRIGGER IF EXISTS line_occupancy_ticket ON "Ticket";
CREATE TRIGGER line_occupancy_ticket AFTER UPDATE ON "Ticket"
  FOR EACH ROW WHEN ((OLD."statusId", OLD."status") IS DISTINCT FROM (NEW."statusId", NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_ticket();

DROP TRIGGER IF EXISTS line_occupancy_ticket_status ON "TicketStatus";
CREATE TRIGGER line_occupancy_ticket_status AFTER UPDATE ON "TicketStatus"
  FOR EACH ROW WHEN (OLD."closes" IS DISTINCT FROM NEW."closes")
  EXECUTE FUNCTION line_occupancy_on_ticket_status();

DROP TRIGGER IF EXISTS line_occupancy_allocation_insert ON "LineAllocation";
CREATE TRIGGER line_occupancy_allocation_insert AFTER INSERT ON "LineAllocation"
  FOR EACH ROW WHEN (NEW."unitId" IS NOT NULL)
  EXECUTE FUNCTION line_occupancy_on_allocation();

DROP TRIGGER IF EXISTS line_occupancy_allocation_update ON "LineAllocation";
CREATE TRIGGER line_occupancy_allocation_update AFTER UPDATE ON "LineAllocation"
  FOR EACH ROW WHEN ((OLD."unitId", OLD."status", OLD."lineId", OLD."demandId")
    IS DISTINCT FROM (NEW."unitId", NEW."status", NEW."lineId", NEW."demandId"))
  EXECUTE FUNCTION line_occupancy_on_allocation();

DROP TRIGGER IF EXISTS line_occupancy_item_demand ON "ItemDemand";
CREATE TRIGGER line_occupancy_item_demand AFTER UPDATE ON "ItemDemand"
  FOR EACH ROW WHEN ((OLD."windows", OLD."status") IS DISTINCT FROM (NEW."windows", NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_item_demand();
