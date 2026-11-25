-- Tasks (ADR 0117), part two: uses the TASK enum values the previous migration added (a new enum
-- value cannot be used in the transaction that adds it). Task types always carry a shape, every
-- other base none (like buyerKind), and record relations cover tasks: their creator, assignee
-- and followers (packages/db/sql/sync_record_relations.sql). No task exists yet: no backfill.

ALTER TABLE "EntityType" ADD CONSTRAINT "EntityType_taskShape_task_only"
  CHECK (("base" = 'TASK') = ("taskShape" IS NOT NULL));

-- BEGIN packages/db/sql/sync_record_relations.sql
-- Record relations are a projection of assignments and responsibilities (ADR 0055, 0113). This
-- file is the source of the functions and triggers; the latest migration that includes it applies
-- it verbatim (`packages/db/test/line-holds-sql.test.ts` keeps the two in step).
--
-- For an order, item or task record (ADR 0117):
-- - CREATOR: the order's or task's `Record.createdBy`, unless SYSTEM.
-- - A slot is the main slot when it has an active stored choice (`Assignment` without a
--   responsibility), and an active responsibility's slot when the responsibility covers the item
--   type of one of the order's active lines, or someone made an active choice on it.
-- - ASSIGNEE of a slot: the chosen assignee (EXPLICIT), else the responsibility's default
--   assignee (DEFAULT).
-- - FOLLOWER of a slot: the responsibility's default followers without an UNFOLLOW (DEFAULT),
--   plus chosen FOLLOWs of members who are not default followers (EXPLICIT).
-- Rows that no longer hold are ARCHIVED; one row per (record, principal, relation, slot) is kept
-- and reactivated. Everything is set-based over an array of record ids and joins on
-- `organizationId`, so a trigger and the backfill use the same indexed derivation.

DROP FUNCTION IF EXISTS record_relation_wanted(text);
DROP FUNCTION IF EXISTS sync_record_relations(text);

-- The rows the records should have. Records that are not an order, item or task have none.
CREATE OR REPLACE FUNCTION record_relation_wanted(record_ids text[])
RETURNS TABLE (record_id text, organization_id text, principal_id text,
  relation "RecordRelationKind", responsibility_id text, source "RecordRelationSource")
LANGUAGE sql STABLE AS $$
  WITH rec AS (
    SELECT r."id", r."organizationId" AS org, r."base", r."createdBy"
      FROM "Record" r
     WHERE r."id" = ANY(record_ids) AND r."base" IN ('ORDER', 'ITEM', 'TASK')
  ),
  choices AS (
    SELECT rec."id" AS rec_id, rec.org, a."id", a."responsibilityId" AS rid, a."assigneeId"
      FROM rec
      JOIN "Assignment" a ON a."organizationId" = rec.org AND a."recordId" = rec."id"
     WHERE a."status" = 'ACTIVE'
  ),
  applicable AS (
    SELECT DISTINCT rec."id" AS rec_id, rec.org, ret."responsibilityId" AS rid
      FROM rec
      JOIN "Line" l ON l."organizationId" = rec.org AND l."orderId" = rec."id"
        AND l."status" = 'ACTIVE'
      JOIN "Item" i ON i."id" = l."itemId"
      JOIN "ResponsibilityEntityType" ret ON ret."organizationId" = rec.org
        AND ret."entityTypeId" = i."entityTypeId"
     WHERE rec."base" = 'ORDER'
  ),
  slots AS (
    SELECT c.rec_id, c.org, c.rid FROM choices c WHERE c.rid IS NULL
    UNION
    SELECT s.rec_id, s.org, s.rid
      FROM (SELECT rec_id, org, rid FROM choices WHERE rid IS NOT NULL
            UNION SELECT rec_id, org, rid FROM applicable) s
      JOIN "Responsibility" resp ON resp."id" = s.rid AND resp."status" = 'ACTIVE'
  ),
  slot_choice AS (
    SELECT s.rec_id, s.org, s.rid, c."id" AS choice_id, c."assigneeId",
           resp."defaultAssigneeId"
      FROM slots s
      LEFT JOIN choices c ON c.rec_id = s.rec_id AND c.rid IS NOT DISTINCT FROM s.rid
      LEFT JOIN "Responsibility" resp ON resp."id" = s.rid
  )
  SELECT sc.rec_id, sc.org, COALESCE(sc."assigneeId", sc."defaultAssigneeId"),
         'ASSIGNEE'::"RecordRelationKind", sc.rid,
         CASE WHEN sc."assigneeId" IS NOT NULL THEN 'EXPLICIT' ELSE 'DEFAULT' END
           ::"RecordRelationSource"
    FROM slot_choice sc
   WHERE COALESCE(sc."assigneeId", sc."defaultAssigneeId") IS NOT NULL
  UNION
  SELECT sc.rec_id, sc.org, df."userId", 'FOLLOWER', sc.rid, 'DEFAULT'
    FROM slot_choice sc
    JOIN "ResponsibilityDefaultFollower" df ON df."responsibilityId" = sc.rid
   WHERE NOT EXISTS (
     SELECT 1 FROM "AssignmentFollower" f
      WHERE f."assignmentId" = sc.choice_id AND f."userId" = df."userId"
        AND f."effect" = 'UNFOLLOW')
  UNION
  SELECT sc.rec_id, sc.org, f."userId", 'FOLLOWER', sc.rid, 'EXPLICIT'
    FROM slot_choice sc
    JOIN "AssignmentFollower" f ON f."assignmentId" = sc.choice_id AND f."effect" = 'FOLLOW'
   WHERE NOT EXISTS (
     SELECT 1 FROM "ResponsibilityDefaultFollower" df
      WHERE df."responsibilityId" = sc.rid AND df."userId" = f."userId")
  UNION
  SELECT rec."id", rec.org, rec."createdBy", 'CREATOR', NULL, 'EXPLICIT'
    FROM rec
   WHERE rec."base" IN ('ORDER', 'TASK') AND rec."createdBy" IS NOT NULL
     AND rec."createdBy" <> 'system'
$$;

-- Derives the records' rows once (`record_relation_wanted`) in one statement: archives the rows
-- whose key is no longer wanted, and writes, reactivates or re-sources the rest. The archive
-- matches on the key without `source`, so the three parts never touch the same row.
CREATE OR REPLACE FUNCTION sync_record_relations_of(record_ids text[])
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  now_utc timestamp(3) := now() AT TIME ZONE 'UTC';
BEGIN
  IF COALESCE(cardinality(record_ids), 0) = 0 THEN RETURN; END IF;
  WITH wanted AS MATERIALIZED (
    SELECT * FROM record_relation_wanted(record_ids)
  ),
  archived AS (
    UPDATE "RecordRelation" rr SET "status" = 'ARCHIVED', "updatedAt" = now_utc
     WHERE rr."recordId" = ANY(record_ids) AND rr."status" <> 'ARCHIVED'
       AND NOT EXISTS (
         SELECT 1 FROM wanted w
          WHERE w.record_id = rr."recordId" AND w.principal_id = rr."principalId"
            AND w.relation = rr."relation"
            AND w.responsibility_id IS NOT DISTINCT FROM rr."responsibilityId")
    RETURNING 1
  ),
  slot_rows AS (
    INSERT INTO "RecordRelation" ("id", "organizationId", "recordId", "principalId", "relation",
      "responsibilityId", "source", "status", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, w.organization_id, w.record_id, w.principal_id, w.relation,
      w.responsibility_id, w.source, 'ACTIVE', now_utc, now_utc
      FROM wanted w WHERE w.responsibility_id IS NOT NULL
    ON CONFLICT ("recordId", "principalId", "relation", "responsibilityId") DO UPDATE
      SET "source" = EXCLUDED."source", "status" = 'ACTIVE', "updatedAt" = now_utc
      WHERE ("RecordRelation"."source", "RecordRelation"."status")
        IS DISTINCT FROM (EXCLUDED."source", 'ACTIVE'::"RecordStatus")
    RETURNING 1
  )
  INSERT INTO "RecordRelation" ("id", "organizationId", "recordId", "principalId", "relation",
    "responsibilityId", "source", "status", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, w.organization_id, w.record_id, w.principal_id, w.relation,
    NULL, w.source, 'ACTIVE', now_utc, now_utc
    FROM wanted w WHERE w.responsibility_id IS NULL
  ON CONFLICT ("recordId", "principalId", "relation") WHERE "responsibilityId" IS NULL DO UPDATE
    SET "source" = EXCLUDED."source", "status" = 'ACTIVE', "updatedAt" = now_utc
    WHERE ("RecordRelation"."source", "RecordRelation"."status")
      IS DISTINCT FROM (EXCLUDED."source", 'ACTIVE'::"RecordStatus");
END $$;

-- Orders a responsibility may touch: those with an active line it covers, a choice on it, or a
-- current relation through it (so removed coverage is archived too).
CREATE OR REPLACE FUNCTION records_of_responsibility(target_responsibility_id text)
RETURNS text[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(array_agg(DISTINCT id), '{}') FROM (
    SELECT l."orderId" AS id
      FROM "ResponsibilityEntityType" ret
      JOIN "Item" i ON i."organizationId" = ret."organizationId"
        AND i."entityTypeId" = ret."entityTypeId"
      JOIN "Line" l ON l."organizationId" = i."organizationId" AND l."itemId" = i."id"
        AND l."status" = 'ACTIVE'
     WHERE ret."responsibilityId" = target_responsibility_id
    UNION
    SELECT a."recordId" FROM "Assignment" a WHERE a."responsibilityId" = target_responsibility_id
    UNION
    SELECT rr."recordId" FROM "RecordRelation" rr
      JOIN "Responsibility" resp ON resp."id" = target_responsibility_id
     WHERE rr."organizationId" = resp."organizationId"
       AND rr."responsibilityId" = target_responsibility_id AND rr."status" = 'ACTIVE'
  ) touched
$$;

CREATE OR REPLACE FUNCTION record_relations_on_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_record_relations_of(ARRAY[NEW."id"]);
  RETURN NULL;
END $$;

-- Line triggers are per statement (transition tables): a bulk insert of many lines on one order
-- derives that order once, not once per line.
DROP FUNCTION IF EXISTS record_relations_on_line() CASCADE;

CREATE OR REPLACE FUNCTION record_relations_on_line_insert() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_record_relations_of(ARRAY(SELECT DISTINCT n."orderId" FROM new_lines n));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_relations_on_line_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_record_relations_of(ARRAY(
    SELECT DISTINCT changed.order_id FROM (
      SELECT n."orderId" AS order_id, o."orderId" AS old_order_id
        FROM new_lines n JOIN old_lines o ON o."id" = n."id"
       WHERE (o."itemId", o."status", o."orderId")
             IS DISTINCT FROM (n."itemId", n."status", n."orderId")
    ) moved, LATERAL (VALUES (moved.order_id), (moved.old_order_id)) AS changed(order_id)));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_relations_on_item() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_record_relations_of(ARRAY(
    SELECT DISTINCT l."orderId" FROM "Line" l
     WHERE l."organizationId" = NEW."organizationId" AND l."itemId" = NEW."id"
       AND l."status" = 'ACTIVE'));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_relations_on_assignment() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."recordId" IS DISTINCT FROM NEW."recordId" THEN
    PERFORM sync_record_relations_of(ARRAY[NEW."recordId", OLD."recordId"]);
  ELSE
    PERFORM sync_record_relations_of(ARRAY[NEW."recordId"]);
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_relations_on_follower() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  changed "AssignmentFollower";
BEGIN
  IF TG_OP = 'DELETE' THEN changed := OLD; ELSE changed := NEW; END IF;
  PERFORM sync_record_relations_of(ARRAY(
    SELECT a."recordId" FROM "Assignment" a WHERE a."id" = changed."assignmentId"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_relations_on_responsibility() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_record_relations_of(records_of_responsibility(NEW."id"));
  RETURN NULL;
END $$;

-- Join rows of a responsibility (covered types, default followers): a replacement set.
CREATE OR REPLACE FUNCTION record_relations_on_responsibility_row() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target text;
BEGIN
  IF TG_OP = 'DELETE' THEN target := OLD."responsibilityId";
  ELSE target := NEW."responsibilityId"; END IF;
  PERFORM sync_record_relations_of(records_of_responsibility(target));
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS record_relations_record ON "Record";
CREATE TRIGGER record_relations_record AFTER INSERT ON "Record"
  FOR EACH ROW WHEN (NEW."base" IN ('ORDER', 'ITEM', 'TASK'))
  EXECUTE FUNCTION record_relations_on_record();

DROP TRIGGER IF EXISTS record_relations_line_insert ON "Line";
CREATE TRIGGER record_relations_line_insert AFTER INSERT ON "Line"
  REFERENCING NEW TABLE AS new_lines
  FOR EACH STATEMENT EXECUTE FUNCTION record_relations_on_line_insert();

DROP TRIGGER IF EXISTS record_relations_line_update ON "Line";
CREATE TRIGGER record_relations_line_update AFTER UPDATE ON "Line"
  REFERENCING OLD TABLE AS old_lines NEW TABLE AS new_lines
  FOR EACH STATEMENT EXECUTE FUNCTION record_relations_on_line_update();

DROP TRIGGER IF EXISTS record_relations_item ON "Item";
CREATE TRIGGER record_relations_item AFTER UPDATE ON "Item"
  FOR EACH ROW WHEN (OLD."entityTypeId" IS DISTINCT FROM NEW."entityTypeId")
  EXECUTE FUNCTION record_relations_on_item();

DROP TRIGGER IF EXISTS record_relations_assignment_insert ON "Assignment";
CREATE TRIGGER record_relations_assignment_insert AFTER INSERT ON "Assignment"
  FOR EACH ROW EXECUTE FUNCTION record_relations_on_assignment();

DROP TRIGGER IF EXISTS record_relations_assignment_update ON "Assignment";
CREATE TRIGGER record_relations_assignment_update AFTER UPDATE ON "Assignment"
  FOR EACH ROW WHEN ((OLD."assigneeId", OLD."status", OLD."responsibilityId", OLD."recordId")
    IS DISTINCT FROM (NEW."assigneeId", NEW."status", NEW."responsibilityId", NEW."recordId"))
  EXECUTE FUNCTION record_relations_on_assignment();

DROP TRIGGER IF EXISTS record_relations_follower ON "AssignmentFollower";
CREATE TRIGGER record_relations_follower AFTER INSERT OR UPDATE OR DELETE ON "AssignmentFollower"
  FOR EACH ROW EXECUTE FUNCTION record_relations_on_follower();

DROP TRIGGER IF EXISTS record_relations_responsibility ON "Responsibility";
CREATE TRIGGER record_relations_responsibility AFTER UPDATE ON "Responsibility"
  FOR EACH ROW WHEN ((OLD."defaultAssigneeId", OLD."status")
    IS DISTINCT FROM (NEW."defaultAssigneeId", NEW."status"))
  EXECUTE FUNCTION record_relations_on_responsibility();

DROP TRIGGER IF EXISTS record_relations_responsibility_type ON "ResponsibilityEntityType";
CREATE TRIGGER record_relations_responsibility_type
  AFTER INSERT OR UPDATE OR DELETE ON "ResponsibilityEntityType"
  FOR EACH ROW EXECUTE FUNCTION record_relations_on_responsibility_row();

DROP TRIGGER IF EXISTS record_relations_responsibility_follower ON "ResponsibilityDefaultFollower";
CREATE TRIGGER record_relations_responsibility_follower
  AFTER INSERT OR UPDATE OR DELETE ON "ResponsibilityDefaultFollower"
  FOR EACH ROW EXECUTE FUNCTION record_relations_on_responsibility_row();
-- END packages/db/sql/sync_record_relations.sql
