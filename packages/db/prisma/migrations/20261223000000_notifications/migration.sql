-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('ASSIGNED', 'WORK_ORDER_SENT', 'TICKET_STATUS_CHANGED', 'PAYMENT_RECEIVED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "actorUserId" TEXT,
    "ticketId" TEXT,
    "workOrderId" TEXT,
    "paymentId" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_organizationId_recipientUserId_readAt_createdA_idx" ON "Notification"("organizationId", "recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_recipientUserId_createdAt_idx" ON "Notification"("organizationId", "recipientUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_id_organizationId_key" ON "Notification"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_organizationId_userId_kind_key" ON "NotificationPreference"("organizationId", "userId", "kind");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workOrderId_organizationId_fkey" FOREIGN KEY ("workOrderId", "organizationId") REFERENCES "WorkOrder"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_paymentId_organizationId_fkey" FOREIGN KEY ("paymentId", "organizationId") REFERENCES "Payment"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- BEGIN packages/db/sql/notify_notification.sql
-- Push signal (ADR 0094): tells listeners (the web app's notification stream) that a member's
-- notifications changed. The payload carries ids only; listeners re-read the unread count.
CREATE OR REPLACE FUNCTION notify_notification() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'notification',
    json_build_object(
      'organizationId', NEW."organizationId",
      'recipientUserId', NEW."recipientUserId"
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
