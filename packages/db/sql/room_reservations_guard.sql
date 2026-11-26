-- Room vs tables (ADR 0119): a hard hold on a room (an order line's or a task's HARD hold, its
-- buffers, or a manual block) may not overlap the room's active table reservations. Soft holds
-- may. The same advisory lock as core's table bookings (`$advisoryLock`, key
-- `<organization>:room:<item>`) serialises the two paths, so neither can slip past the other.
CREATE OR REPLACE FUNCTION room_reservations_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" <> 'ACTIVE' OR NEW."holdKind" IS NOT DISTINCT FROM 'SOFT' THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "DiningRoom" d
    WHERE d."itemId" = NEW."itemId" AND d."organizationId" = NEW."organizationId"
  ) THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."organizationId" || ':room:' || NEW."itemId", 0));
  IF EXISTS (
    SELECT 1
    FROM "TableHold" h
    JOIN "FloorElement" e ON e."id" = h."elementId"
    JOIN "SetupLayout" l ON l."id" = e."setupLayoutId"
    WHERE l."itemId" = NEW."itemId"
      AND h."organizationId" = NEW."organizationId"
      AND h."status" = 'ACTIVE'
      AND h."kind" = 'RESERVATION'
      AND h."startsAt" < NEW."endsAt"
      AND h."endsAt" > NEW."startsAt"
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'room_reservations_conflict', DETAIL = NEW."itemId";
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "Occupancy_room_reservations_guard" ON "Occupancy";
CREATE TRIGGER "Occupancy_room_reservations_guard"
  BEFORE INSERT OR UPDATE OF "status", "holdKind", "startsAt", "endsAt", "itemId" ON "Occupancy"
  FOR EACH ROW EXECUTE FUNCTION room_reservations_guard();
