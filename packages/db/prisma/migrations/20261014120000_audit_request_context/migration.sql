-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "surface" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_requestId_idx" ON "AuditLog"("organizationId", "requestId");
