-- CreateEnum
CREATE TYPE "FloorShape" AS ENUM ('RECT', 'ROUND', 'SEAT_ROW', 'ZONE');

-- AlterTable
ALTER TABLE "ItemSetup" ALTER COLUMN "capacity" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FloorElementKind" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shape" "FloorShape" NOT NULL,
    "widthCm" INTEGER NOT NULL,
    "depthCm" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 0,
    "seatsTop" INTEGER NOT NULL DEFAULT 0,
    "seatsRight" INTEGER NOT NULL DEFAULT 0,
    "seatsBottom" INTEGER NOT NULL DEFAULT 0,
    "seatsLeft" INTEGER NOT NULL DEFAULT 0,
    "fixed" BOOLEAN NOT NULL DEFAULT false,
    "keepClearCm" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "FloorElementKind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "widthCm" INTEGER NOT NULL,
    "depthCm" INTEGER NOT NULL,
    "outline" JSONB NOT NULL,
    "minAisleCm" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupLayout" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "note" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SetupLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorElement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "floorPlanId" TEXT,
    "setupLayoutId" TEXT,
    "kindId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "xCm" INTEGER NOT NULL,
    "yCm" INTEGER NOT NULL,
    "rotationDeg" INTEGER NOT NULL DEFAULT 0,
    "widthCm" INTEGER,
    "depthCm" INTEGER,
    "seats" INTEGER,
    "seatsTop" INTEGER,
    "seatsRight" INTEGER,
    "seatsBottom" INTEGER,
    "seatsLeft" INTEGER,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "FloorElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorElementKind_organizationId_status_idx" ON "FloorElementKind"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FloorElementKind_id_organizationId_key" ON "FloorElementKind"("id", "organizationId");

-- CreateIndex
CREATE INDEX "FloorPlan_organizationId_status_idx" ON "FloorPlan"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FloorPlan_id_organizationId_key" ON "FloorPlan"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FloorPlan_itemId_organizationId_key" ON "FloorPlan"("itemId", "organizationId");

-- CreateIndex
CREATE INDEX "SetupLayout_organizationId_itemId_idx" ON "SetupLayout"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SetupLayout_id_organizationId_key" ON "SetupLayout"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SetupLayout_itemId_setupId_key" ON "SetupLayout"("itemId", "setupId");

-- CreateIndex
CREATE INDEX "FloorElement_organizationId_floorPlanId_idx" ON "FloorElement"("organizationId", "floorPlanId");

-- CreateIndex
CREATE INDEX "FloorElement_organizationId_setupLayoutId_idx" ON "FloorElement"("organizationId", "setupLayoutId");

-- CreateIndex
CREATE INDEX "FloorElement_organizationId_kindId_idx" ON "FloorElement"("organizationId", "kindId");

-- AddForeignKey
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupLayout" ADD CONSTRAINT "SetupLayout_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupLayout" ADD CONSTRAINT "SetupLayout_setupId_organizationId_fkey" FOREIGN KEY ("setupId", "organizationId") REFERENCES "Setup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorElement" ADD CONSTRAINT "FloorElement_floorPlanId_organizationId_fkey" FOREIGN KEY ("floorPlanId", "organizationId") REFERENCES "FloorPlan"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorElement" ADD CONSTRAINT "FloorElement_setupLayoutId_organizationId_fkey" FOREIGN KEY ("setupLayoutId", "organizationId") REFERENCES "SetupLayout"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorElement" ADD CONSTRAINT "FloorElement_kindId_organizationId_fkey" FOREIGN KEY ("kindId", "organizationId") REFERENCES "FloorElementKind"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A floor element belongs to exactly one floor plan or one setup layout (ADR 0099).
ALTER TABLE "FloorElement" ADD CONSTRAINT "FloorElement_one_parent_check" CHECK (("floorPlanId" IS NULL) <> ("setupLayoutId" IS NULL));
