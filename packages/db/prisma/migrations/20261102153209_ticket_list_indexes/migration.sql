-- CreateIndex
CREATE INDEX "Ticket_organizationId_desiredStartsAt_idx" ON "Ticket"("organizationId", "desiredStartsAt");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_entityTypeId_idx" ON "Ticket"("organizationId", "entityTypeId");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_estimatedHeadcount_idx" ON "Ticket"("organizationId", "estimatedHeadcount");
