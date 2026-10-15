-- CreateTable
CREATE TABLE "SheetDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityTypeIds" TEXT[],
    "fieldIds" TEXT[],
    "vocabularyIds" TEXT[],
    "roleId" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SheetDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SheetDefinition_organizationId_status_idx" ON "SheetDefinition"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SheetDefinition_id_organizationId_key" ON "SheetDefinition"("id", "organizationId");
