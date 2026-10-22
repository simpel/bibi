-- Projection (ADR 0051, 0061): "user"."name" is "firstName lastName" of the user's profile.
-- Better Auth reads and shows "name"; only this trigger writes it once a profile exists.
CREATE OR REPLACE FUNCTION sync_user_name() RETURNS trigger AS $$
BEGIN
  UPDATE "user"
     SET "name" = btrim(NEW."firstName" || ' ' || NEW."lastName"),
         "updatedAt" = now()
   WHERE "id" = NEW."userId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profile_sync_name ON "UserProfile";
CREATE TRIGGER user_profile_sync_name
  AFTER INSERT OR UPDATE OF "firstName", "lastName" ON "UserProfile"
  FOR EACH ROW EXECUTE FUNCTION sync_user_name();
