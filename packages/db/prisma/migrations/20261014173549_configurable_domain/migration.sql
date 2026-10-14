/*
  Warnings:

  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EntityBase" AS ENUM ('ITEM', 'CUSTOMER', 'CONTACT', 'INQUIRY', 'BOOKING', 'REQUIREMENT');

-- CreateEnum
CREATE TYPE "ItemBehaviour" AS ENUM ('PRICED', 'COMPOSABLE', 'CHOICES', 'BOOKABLE', 'SETUPS');

-- CreateEnum
CREATE TYPE "FieldKind" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'CHOICE', 'MULTI_CHOICE');

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('PER_PERSON', 'PER_UNIT', 'PER_HOUR', 'FLAT');

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_venueId_organizationId_fkey";

-- DropTable
DROP TABLE "Room";

-- CreateTable
CREATE TABLE "EntityType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "base" "EntityBase" NOT NULL,
    "name" TEXT NOT NULL,
    "behaviours" "ItemBehaviour"[],
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "EntityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FieldKind" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "vocabularyId" TEXT,
    "options" TEXT[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "FieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyValue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "VocabularyValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "changeoverMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Setup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityTypeId" TEXT NOT NULL,
    "venueId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "priceMinor" INTEGER,
    "priceUnit" "PriceUnit",
    "vatRatePercent" INTEGER,
    "defaultDurationMinutes" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemSetup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemSetup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityType_organizationId_base_status_idx" ON "EntityType"("organizationId", "base", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EntityType_id_organizationId_key" ON "EntityType"("id", "organizationId");

-- CreateIndex
CREATE INDEX "FieldDefinition_organizationId_entityTypeId_status_idx" ON "FieldDefinition"("organizationId", "entityTypeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_id_organizationId_key" ON "FieldDefinition"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_entityTypeId_key_key" ON "FieldDefinition"("entityTypeId", "key");

-- CreateIndex
CREATE INDEX "Vocabulary_organizationId_status_idx" ON "Vocabulary"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Vocabulary_id_organizationId_key" ON "Vocabulary"("id", "organizationId");

-- CreateIndex
CREATE INDEX "VocabularyValue_organizationId_vocabularyId_status_idx" ON "VocabularyValue"("organizationId", "vocabularyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyValue_id_organizationId_key" ON "VocabularyValue"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Setup_organizationId_status_idx" ON "Setup"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Setup_id_organizationId_key" ON "Setup"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Item_organizationId_status_idx" ON "Item"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Item_organizationId_entityTypeId_idx" ON "Item"("organizationId", "entityTypeId");

-- CreateIndex
CREATE INDEX "Item_organizationId_venueId_idx" ON "Item"("organizationId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_id_organizationId_key" ON "Item"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ItemSetup_organizationId_itemId_idx" ON "ItemSetup"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemSetup_itemId_setupId_key" ON "ItemSetup"("itemId", "setupId");

-- AddForeignKey
ALTER TABLE "FieldDefinition" ADD CONSTRAINT "FieldDefinition_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldDefinition" ADD CONSTRAINT "FieldDefinition_vocabularyId_organizationId_fkey" FOREIGN KEY ("vocabularyId", "organizationId") REFERENCES "Vocabulary"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyValue" ADD CONSTRAINT "VocabularyValue_vocabularyId_organizationId_fkey" FOREIGN KEY ("vocabularyId", "organizationId") REFERENCES "Vocabulary"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_venueId_organizationId_fkey" FOREIGN KEY ("venueId", "organizationId") REFERENCES "Venue"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSetup" ADD CONSTRAINT "ItemSetup_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSetup" ADD CONSTRAINT "ItemSetup_setupId_organizationId_fkey" FOREIGN KEY ("setupId", "organizationId") REFERENCES "Setup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
