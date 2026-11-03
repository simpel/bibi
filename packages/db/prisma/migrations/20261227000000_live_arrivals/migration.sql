-- New notifications and inbox messages carry their id in the push signal, so the browser can
-- toast them (ADR 0094). Hand-written: Prisma does not see triggers.
-- BEGIN packages/db/sql/notify_notification.sql
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
-- END packages/db/sql/notify_notification.sql

-- BEGIN packages/db/sql/notify_inbox.sql
-- Push signal (ADR 0085, 0094): tells listeners (the web app's stream) that an organization's
-- inbox changed: a message came in, got a ticket, was read or unread, or was deleted. The payload
-- carries the organization only; listeners re-read the open count. `arrivedId` is a new inbox
-- message's id (inserted without a ticket; the browser toasts it), else null.
CREATE OR REPLACE FUNCTION notify_inbox() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'inbox',
    json_build_object(
      'organizationId', NEW."organizationId",
      'arrivedId', CASE WHEN TG_OP = 'INSERT' AND NEW."ticketId" IS NULL THEN NEW."id" END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";
CREATE TRIGGER inbound_message_notify
  AFTER INSERT OR UPDATE OF "ticketId", "readAt", "status" ON "InboundMessage"
  FOR EACH ROW EXECUTE FUNCTION notify_inbox();
-- END packages/db/sql/notify_inbox.sql
