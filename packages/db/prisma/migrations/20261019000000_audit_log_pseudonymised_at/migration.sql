-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "pseudonymisedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AuditLog_pseudonymisedAt_createdAt_idx" ON "AuditLog"("pseudonymisedAt", "createdAt");
