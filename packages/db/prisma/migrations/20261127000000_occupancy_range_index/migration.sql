-- CreateIndex
CREATE INDEX "Occupancy_organizationId_status_endsAt_idx" ON "Occupancy"("organizationId", "status", "endsAt");
