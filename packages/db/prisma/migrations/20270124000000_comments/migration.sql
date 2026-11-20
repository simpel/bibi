-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineId" TEXT,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_organizationId_orderId_status_idx" ON "Comment"("organizationId", "orderId", "status");

-- CreateIndex
CREATE INDEX "Comment_organizationId_lineId_idx" ON "Comment"("organizationId", "lineId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_id_organizationId_key" ON "Comment"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_orderId_organizationId_fkey" FOREIGN KEY ("orderId", "organizationId") REFERENCES "Order"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_lineId_organizationId_fkey" FOREIGN KEY ("lineId", "organizationId") REFERENCES "Line"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

