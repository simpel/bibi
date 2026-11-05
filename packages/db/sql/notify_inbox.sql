-- Push signal (ADR 0085, 0094): tells listeners (the web app's stream) that an organization's
-- inbox changed: a message came in, got a order, was read or unread, or was deleted. The payload
-- carries the organization only; listeners re-read the open count. `arrivedId` is a new inbox
-- message's id (inserted without a order; the browser toasts it), else null.
CREATE OR REPLACE FUNCTION notify_inbox() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'inbox',
    json_build_object(
      'organizationId', NEW."organizationId",
      'arrivedId', CASE WHEN TG_OP = 'INSERT' AND NEW."orderId" IS NULL THEN NEW."id" END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";
CREATE TRIGGER inbound_message_notify
  AFTER INSERT OR UPDATE OF "orderId", "readAt", "status" ON "InboundMessage"
  FOR EACH ROW EXECUTE FUNCTION notify_inbox();
