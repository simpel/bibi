-- CreateTable
CREATE TABLE "TicketTemplateLineOption" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateLineId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "TicketTemplateLineOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketTemplateLineOption_organizationId_itemId_idx" ON "TicketTemplateLineOption"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTemplateLineOption_id_organizationId_key" ON "TicketTemplateLineOption"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTemplateLineOption_templateLineId_itemId_key" ON "TicketTemplateLineOption"("templateLineId", "itemId");

-- AddForeignKey
ALTER TABLE "TicketTemplateLineOption" ADD CONSTRAINT "TicketTemplateLineOption_templateLineId_organizationId_fkey" FOREIGN KEY ("templateLineId", "organizationId") REFERENCES "TicketTemplateLine"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTemplateLineOption" ADD CONSTRAINT "TicketTemplateLineOption_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
