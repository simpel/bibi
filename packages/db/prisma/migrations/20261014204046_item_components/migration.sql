-- CreateTable
CREATE TABLE "ItemComponent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "offsetMinutes" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ItemComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemComponent_organizationId_parentId_idx" ON "ItemComponent"("organizationId", "parentId");

-- CreateIndex
CREATE INDEX "ItemComponent_organizationId_partId_idx" ON "ItemComponent"("organizationId", "partId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemComponent_parentId_partId_key" ON "ItemComponent"("parentId", "partId");

-- AddForeignKey
ALTER TABLE "ItemComponent" ADD CONSTRAINT "ItemComponent_parentId_organizationId_fkey" FOREIGN KEY ("parentId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComponent" ADD CONSTRAINT "ItemComponent_partId_organizationId_fkey" FOREIGN KEY ("partId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
