-- CreateEnum
CREATE TYPE "TemplateQuantityBasis" AS ENUM ('FIXED', 'PER_HEADCOUNT');

-- CreateTable
CREATE TABLE "TicketTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTemplateLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "entityTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemId" TEXT,
    "setupId" TEXT,
    "offsetMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "quantity" INTEGER,
    "quantityBasis" "TemplateQuantityBasis" NOT NULL DEFAULT 'FIXED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketTemplateLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketTemplate_organizationId_status_idx" ON "TicketTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TicketTemplate_organizationId_phaseId_idx" ON "TicketTemplate"("organizationId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTemplate_id_organizationId_key" ON "TicketTemplate"("id", "organizationId");

-- CreateIndex
CREATE INDEX "TicketTemplateLine_organizationId_templateId_position_idx" ON "TicketTemplateLine"("organizationId", "templateId", "position");

-- CreateIndex
CREATE INDEX "TicketTemplateLine_organizationId_itemId_idx" ON "TicketTemplateLine"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTemplateLine_id_organizationId_key" ON "TicketTemplateLine"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_phaseId_organizationId_fkey" FOREIGN KEY ("phaseId", "organizationId") REFERENCES "TicketPhase"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplateLine" ADD CONSTRAINT "TicketTemplateLine_templateId_organizationId_fkey" FOREIGN KEY ("templateId", "organizationId") REFERENCES "TicketTemplate"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplateLine" ADD CONSTRAINT "TicketTemplateLine_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplateLine" ADD CONSTRAINT "TicketTemplateLine_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplateLine" ADD CONSTRAINT "TicketTemplateLine_setupId_organizationId_fkey" FOREIGN KEY ("setupId", "organizationId") REFERENCES "Setup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
