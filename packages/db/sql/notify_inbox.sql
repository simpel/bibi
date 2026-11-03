-- Push signal (ADR 0085, 0094): tells listeners (the web app's stream) that an organization's
-- inbox changed: a message came in, got a ticket, was read or unread, or was deleted. The payload
-- carries the organization only; listeners re-read the open count.
CREATE OR REPLACE FUNCTION notify_inbox() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('inbox', json_build_object('organizationId', NEW."organizationId")::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";
CREATE TRIGGER inbound_message_notify
  AFTER INSERT OR UPDATE OF "ticketId", "readAt", "status" ON "InboundMessage"
  FOR EACH ROW EXECUTE FUNCTION notify_inbox();
