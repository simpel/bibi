-- CreateEnum
CREATE TYPE "RecordBase" AS ENUM ('ITEM', 'CUSTOMER', 'CONTACT', 'TICKET', 'TICKET_TEMPLATE', 'LINE', 'REQUIREMENT');

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "base" "RecordBase" NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Record_organizationId_entityTypeId_status_idx" ON "Record"("organizationId", "entityTypeId", "status");

-- CreateIndex
CREATE INDEX "Record_fields_idx" ON "Record" USING GIN ("fields" jsonb_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Record_id_organizationId_key" ON "Record"("id", "organizationId");

-- Backfill: every existing row of the seven tables gets its supertable row (ADR 0056).
INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'ITEM', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "Item";

INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'CUSTOMER', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "Customer";

INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'CONTACT', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "Contact";

INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'TICKET', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "Ticket";

INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'TICKET_TEMPLATE', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "TicketTemplate";

INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'LINE', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "Line";

INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "status", "createdAt", "updatedAt", "createdBy")
SELECT "id", "organizationId", "entityTypeId", 'REQUIREMENT', "fields", "status", "createdAt", "updatedAt", "createdBy" FROM "Requirement";

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_id_organizationId_fkey" FOREIGN KEY ("id", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
