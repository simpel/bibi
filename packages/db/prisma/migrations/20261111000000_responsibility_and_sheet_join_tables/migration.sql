-- ADR 0056, slice 3: id lists become join tables with composite foreign keys, and sheets go to a
-- responsibility instead of a fixed role. There is no production data (ADR 0056): a sheet
-- definition's fixed role has no responsibility to map to, so existing sheet versions and
-- definitions are removed, and dropped id lists are recreated by the demo seed.
DELETE FROM "Sheet";
DELETE FROM "SheetDefinition";

-- AlterTable
ALTER TABLE "Responsibility" DROP COLUMN "defaultFollowerIds",
DROP COLUMN "entityTypeIds";

-- AlterTable
ALTER TABLE "Sheet" DROP COLUMN "roleId",
ADD COLUMN     "responsibilityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SheetDefinition" DROP COLUMN "entityTypeIds",
DROP COLUMN "fieldIds",
DROP COLUMN "roleId",
DROP COLUMN "vocabularyIds",
ADD COLUMN     "responsibilityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ResponsibilityEntityType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ResponsibilityEntityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityDefaultFollower" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ResponsibilityDefaultFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetDefinitionEntityType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sheetDefinitionId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SheetDefinitionEntityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetDefinitionField" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sheetDefinitionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SheetDefinitionField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetDefinitionVocabulary" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sheetDefinitionId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SheetDefinitionVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResponsibilityEntityType_organizationId_entityTypeId_idx" ON "ResponsibilityEntityType"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityEntityType_responsibilityId_entityTypeId_key" ON "ResponsibilityEntityType"("responsibilityId", "entityTypeId");

-- CreateIndex
CREATE INDEX "ResponsibilityDefaultFollower_organizationId_userId_idx" ON "ResponsibilityDefaultFollower"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityDefaultFollower_responsibilityId_userId_key" ON "ResponsibilityDefaultFollower"("responsibilityId", "userId");

-- CreateIndex
CREATE INDEX "SheetDefinitionEntityType_organizationId_entityTypeId_idx" ON "SheetDefinitionEntityType"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetDefinitionEntityType_sheetDefinitionId_entityTypeId_key" ON "SheetDefinitionEntityType"("sheetDefinitionId", "entityTypeId");

-- CreateIndex
CREATE INDEX "SheetDefinitionField_organizationId_fieldId_idx" ON "SheetDefinitionField"("organizationId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetDefinitionField_sheetDefinitionId_fieldId_key" ON "SheetDefinitionField"("sheetDefinitionId", "fieldId");

-- CreateIndex
CREATE INDEX "SheetDefinitionVocabulary_organizationId_vocabularyId_idx" ON "SheetDefinitionVocabulary"("organizationId", "vocabularyId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetDefinitionVocabulary_sheetDefinitionId_vocabularyId_key" ON "SheetDefinitionVocabulary"("sheetDefinitionId", "vocabularyId");

-- CreateIndex
CREATE INDEX "Sheet_organizationId_responsibilityId_idx" ON "Sheet"("organizationId", "responsibilityId");

-- CreateIndex
CREATE INDEX "SheetDefinition_organizationId_responsibilityId_idx" ON "SheetDefinition"("organizationId", "responsibilityId");

-- AddForeignKey
ALTER TABLE "ResponsibilityEntityType" ADD CONSTRAINT "ResponsibilityEntityType_responsibilityId_organizationId_fkey" FOREIGN KEY ("responsibilityId", "organizationId") REFERENCES "Responsibility"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityEntityType" ADD CONSTRAINT "ResponsibilityEntityType_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityDefaultFollower" ADD CONSTRAINT "ResponsibilityDefaultFollower_responsibilityId_organizatio_fkey" FOREIGN KEY ("responsibilityId", "organizationId") REFERENCES "Responsibility"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinition" ADD CONSTRAINT "SheetDefinition_responsibilityId_organizationId_fkey" FOREIGN KEY ("responsibilityId", "organizationId") REFERENCES "Responsibility"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinitionEntityType" ADD CONSTRAINT "SheetDefinitionEntityType_sheetDefinitionId_organizationId_fkey" FOREIGN KEY ("sheetDefinitionId", "organizationId") REFERENCES "SheetDefinition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinitionEntityType" ADD CONSTRAINT "SheetDefinitionEntityType_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinitionField" ADD CONSTRAINT "SheetDefinitionField_sheetDefinitionId_organizationId_fkey" FOREIGN KEY ("sheetDefinitionId", "organizationId") REFERENCES "SheetDefinition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinitionField" ADD CONSTRAINT "SheetDefinitionField_fieldId_organizationId_fkey" FOREIGN KEY ("fieldId", "organizationId") REFERENCES "FieldDefinition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinitionVocabulary" ADD CONSTRAINT "SheetDefinitionVocabulary_sheetDefinitionId_organizationId_fkey" FOREIGN KEY ("sheetDefinitionId", "organizationId") REFERENCES "SheetDefinition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDefinitionVocabulary" ADD CONSTRAINT "SheetDefinitionVocabulary_vocabularyId_organizationId_fkey" FOREIGN KEY ("vocabularyId", "organizationId") REFERENCES "Vocabulary"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_responsibilityId_organizationId_fkey" FOREIGN KEY ("responsibilityId", "organizationId") REFERENCES "Responsibility"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
