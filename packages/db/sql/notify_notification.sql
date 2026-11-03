-- Push signal (ADR 0094): tells listeners (the web app's notification stream) that a member's
-- notifications changed. The payload carries ids only; listeners re-read the unread count.
-- `arrivedId` is the new notification's id on insert (the browser toasts it), else null.
CREATE OR REPLACE FUNCTION notify_notification() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'notification',
    json_build_object(
      'organizationId', NEW."organizationId",
      'recipientUserId', NEW."recipientUserId",
      'arrivedId', CASE WHEN TG_OP = 'INSERT' THEN NEW."id" END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_notify ON "Notification";
CREATE TRIGGER notification_notify
  AFTER INSERT OR UPDATE OF "readAt" ON "Notification"
  FOR EACH ROW EXECUTE FUNCTION notify_notification();
