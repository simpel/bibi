-- The inbox push signal (ADR 0085, 0094). Hand-written: Prisma does not see triggers.
-- BEGIN packages/db/sql/notify_inbox.sql
-- Push signal (ADR 0085, 0094): tells listeners (the web app's stream) that an organization's
-- inbox changed: a message came in, got a ticket, or was dismissed or restored. The payload
-- carries the organization only; listeners re-read the open count.
CREATE OR REPLACE FUNCTION notify_inbox() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('inbox', json_build_object('organizationId', NEW."organizationId")::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";
CREATE TRIGGER inbound_message_notify
  AFTER INSERT OR UPDATE OF "ticketId", "dismissedAt" ON "InboundMessage"
  FOR EACH ROW EXECUTE FUNCTION notify_inbox();
-- END packages/db/sql/notify_inbox.sql
