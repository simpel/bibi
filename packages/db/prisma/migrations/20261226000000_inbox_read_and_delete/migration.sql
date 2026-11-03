-- The inbox has a shared read state and delete instead of dismiss (ADR 0085, amended 2026-11-03).
-- A dismissed message becomes a read one: readAt and readBy take over the dismissal.
ALTER TABLE "InboundMessage" ADD COLUMN "readAt" TIMESTAMP(3),
ADD COLUMN "readBy" TEXT,
ADD COLUMN "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "InboundMessage" SET "readAt" = "dismissedAt", "readBy" = "dismissedBy"
WHERE "dismissedAt" IS NOT NULL;

-- The trigger names "dismissedAt": replace it before the column goes.
DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";

DROP INDEX "InboundMessage_organizationId_dismissedAt_receivedAt_idx";
ALTER TABLE "InboundMessage" DROP COLUMN "dismissedAt", DROP COLUMN "dismissedBy";

CREATE INDEX "InboundMessage_organizationId_status_ticketId_readAt_receiv_idx" ON "InboundMessage"("organizationId", "status", "ticketId", "readAt", "receivedAt");

-- BEGIN packages/db/sql/notify_inbox.sql
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
-- END packages/db/sql/notify_inbox.sql
