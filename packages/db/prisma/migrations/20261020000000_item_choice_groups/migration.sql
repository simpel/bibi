-- AlterTable
ALTER TABLE "ItemComponent" ADD COLUMN     "choiceGroupId" TEXT;

-- CreateTable
CREATE TABLE "ItemChoiceGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minPick" INTEGER NOT NULL,
    "maxPick" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemChoiceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemChoiceGroup_organizationId_itemId_idx" ON "ItemChoiceGroup"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemChoiceGroup_id_organizationId_key" ON "ItemChoiceGroup"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemChoiceGroup_itemId_name_key" ON "ItemChoiceGroup"("itemId", "name");

-- CreateIndex
CREATE INDEX "ItemComponent_organizationId_choiceGroupId_idx" ON "ItemComponent"("organizationId", "choiceGroupId");

-- AddForeignKey
ALTER TABLE "ItemComponent" ADD CONSTRAINT "ItemComponent_choiceGroupId_organizationId_fkey" FOREIGN KEY ("choiceGroupId", "organizationId") REFERENCES "ItemChoiceGroup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemChoiceGroup" ADD CONSTRAINT "ItemChoiceGroup_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
