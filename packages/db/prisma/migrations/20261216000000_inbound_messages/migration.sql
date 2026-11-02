-- CreateEnum
CREATE TYPE "InboundChannel" AS ENUM ('EMAIL', 'WEB_FORM', 'SMS', 'API');

-- CreateTable
CREATE TABLE "InboundEndpoint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "InboundChannel" NOT NULL,
    "address" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultEntityTypeId" TEXT,
    "defaultTemplateId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "InboundEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "InboundChannel" NOT NULL,
    "endpointId" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "fromPhone" TEXT,
    "subject" TEXT,
    "text" TEXT NOT NULL,
    "formFields" JSONB,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "externalId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "ticketId" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboundEndpoint_organizationId_channel_idx" ON "InboundEndpoint"("organizationId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEndpoint_id_organizationId_key" ON "InboundEndpoint"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEndpoint_channel_address_key" ON "InboundEndpoint"("channel", "address");

-- CreateIndex
CREATE INDEX "InboundMessage_organizationId_ticketId_receivedAt_idx" ON "InboundMessage"("organizationId", "ticketId", "receivedAt");

-- CreateIndex
CREATE INDEX "InboundMessage_organizationId_dismissedAt_receivedAt_idx" ON "InboundMessage"("organizationId", "dismissedAt", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InboundMessage_id_organizationId_key" ON "InboundMessage"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundMessage_organizationId_channel_externalId_key" ON "InboundMessage"("organizationId", "channel", "externalId");

-- AddForeignKey
ALTER TABLE "InboundEndpoint" ADD CONSTRAINT "InboundEndpoint_defaultEntityTypeId_organizationId_fkey" FOREIGN KEY ("defaultEntityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEndpoint" ADD CONSTRAINT "InboundEndpoint_defaultTemplateId_organizationId_fkey" FOREIGN KEY ("defaultTemplateId", "organizationId") REFERENCES "TicketTemplate"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_endpointId_organizationId_fkey" FOREIGN KEY ("endpointId", "organizationId") REFERENCES "InboundEndpoint"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_ticketId_organizationId_fkey" FOREIGN KEY ("ticketId", "organizationId") REFERENCES "Ticket"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Every organization gets its EMAIL endpoint (local part = its slug; the domain is
-- MAIL_INBOUND_DOMAIN, added in code) and its API endpoint (ADR 0085 decision 2). Slugs are
-- unique and never start with `ticket-` (ADR 0083), so no address collides with a reply route.
INSERT INTO "InboundEndpoint" ("id", "organizationId", "channel", "address", "name", "updatedAt", "createdBy")
SELECT 'c' || substr(md5(random()::text || o."id" || 'email'), 1, 24), o."id", 'EMAIL', lower(o."slug"), 'Email', CURRENT_TIMESTAMP, 'system'
FROM "organization" o;

INSERT INTO "InboundEndpoint" ("id", "organizationId", "channel", "address", "name", "updatedAt", "createdBy")
SELECT 'c' || substr(md5(random()::text || o."id" || 'api'), 1, 24), o."id", 'API', NULL, 'API', CURRENT_TIMESTAMP, 'system'
FROM "organization" o;

-- Backfill every received mail as an EMAIL message with the same id (ADR 0085 decision 7).
-- Replies on a ticket's own address came in on no endpoint.
INSERT INTO "InboundMessage" (
    "id", "organizationId", "channel", "endpointId", "fromName", "fromEmail", "subject", "text",
    "attachments", "externalId", "receivedAt", "ticketId", "details", "createdAt", "updatedAt", "createdBy"
)
SELECT
    e."id",
    e."organizationId",
    'EMAIL',
    NULL,
    NULLIF(btrim(substring(e."fromAddress" from '^([^<]*)<'), ' "'), ''),
    lower(btrim(coalesce(substring(e."fromAddress" from '<([^<>]+)>'), e."fromAddress"))),
    e."subject",
    coalesce(e."text", ''),
    e."attachments",
    e."providerEmailId",
    e."receivedAt",
    e."ticketId",
    jsonb_build_object(
        'messageId', e."messageId",
        'fromAddress', e."fromAddress",
        'toAddresses', to_jsonb(e."toAddresses"),
        'html', e."html"
    ),
    e."createdAt",
    e."createdAt",
    e."createdBy"
FROM "InboundEmail" e
ON CONFLICT DO NOTHING;
