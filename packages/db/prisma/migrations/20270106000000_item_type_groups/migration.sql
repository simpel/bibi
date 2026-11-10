-- Item type groups (ADR 0101): expand only, a new table and a nullable column.

-- AlterTable
ALTER TABLE "EntityType" ADD COLUMN "groupId" TEXT;

-- CreateTable
CREATE TABLE "ItemTypeGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemTypeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemTypeGroup_organizationId_status_position_idx" ON "ItemTypeGroup"("organizationId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTypeGroup_id_organizationId_key" ON "ItemTypeGroup"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "EntityType" ADD CONSTRAINT "EntityType_groupId_organizationId_fkey" FOREIGN KEY ("groupId", "organizationId") REFERENCES "ItemTypeGroup"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
