-- CreateTable
CREATE TABLE "RecordLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "targetRecordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RecordLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordLink_organizationId_targetRecordId_idx" ON "RecordLink"("organizationId", "targetRecordId");

-- CreateIndex
CREATE INDEX "RecordLink_organizationId_fieldId_idx" ON "RecordLink"("organizationId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordLink_recordId_fieldId_targetRecordId_key" ON "RecordLink"("recordId", "fieldId", "targetRecordId");

-- AddForeignKey
ALTER TABLE "RecordLink" ADD CONSTRAINT "RecordLink_recordId_organizationId_fkey" FOREIGN KEY ("recordId", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLink" ADD CONSTRAINT "RecordLink_fieldId_organizationId_fkey" FOREIGN KEY ("fieldId", "organizationId") REFERENCES "FieldDefinition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLink" ADD CONSTRAINT "RecordLink_targetRecordId_organizationId_fkey" FOREIGN KEY ("targetRecordId", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
