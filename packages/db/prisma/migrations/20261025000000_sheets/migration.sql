-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sheetDefinitionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "roleId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '[]',
    "baseVersion" INTEGER,
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sheet_organizationId_bookingId_idx" ON "Sheet"("organizationId", "bookingId");

-- CreateIndex
CREATE INDEX "Sheet_organizationId_sheetDefinitionId_idx" ON "Sheet"("organizationId", "sheetDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_id_organizationId_key" ON "Sheet"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_bookingId_sheetDefinitionId_version_key" ON "Sheet"("bookingId", "sheetDefinitionId", "version");

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_bookingId_organizationId_fkey" FOREIGN KEY ("bookingId", "organizationId") REFERENCES "Booking"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_sheetDefinitionId_organizationId_fkey" FOREIGN KEY ("sheetDefinitionId", "organizationId") REFERENCES "SheetDefinition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
