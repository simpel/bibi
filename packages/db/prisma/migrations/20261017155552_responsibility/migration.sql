-- CreateTable
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityTypeIds" TEXT[],
    "defaultAssigneeId" TEXT NOT NULL,
    "defaultFollowerIds" TEXT[],
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Responsibility_organizationId_status_idx" ON "Responsibility"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Responsibility_id_organizationId_key" ON "Responsibility"("id", "organizationId");
