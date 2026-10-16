-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "programItemId" TEXT,
    "entityTypeId" TEXT NOT NULL,
    "vocabularyValueId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Requirement_organizationId_bookingId_status_idx" ON "Requirement"("organizationId", "bookingId", "status");

-- CreateIndex
CREATE INDEX "Requirement_organizationId_programItemId_idx" ON "Requirement"("organizationId", "programItemId");

-- CreateIndex
CREATE INDEX "Requirement_organizationId_vocabularyValueId_idx" ON "Requirement"("organizationId", "vocabularyValueId");

-- CreateIndex
CREATE INDEX "Requirement_organizationId_entityTypeId_idx" ON "Requirement"("organizationId", "entityTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_id_organizationId_key" ON "Requirement"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_bookingId_organizationId_fkey" FOREIGN KEY ("bookingId", "organizationId") REFERENCES "Booking"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_programItemId_organizationId_fkey" FOREIGN KEY ("programItemId", "organizationId") REFERENCES "ProgramItem"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_entityTypeId_organizationId_fkey" FOREIGN KEY ("entityTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_vocabularyValueId_organizationId_fkey" FOREIGN KEY ("vocabularyValueId", "organizationId") REFERENCES "VocabularyValue"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A count is never negative; 0 on a program item says "none here" and still replaces the booking's.
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_quantity_check" CHECK ("quantity" >= 0);

-- One active count per list value and level (the booking, or one program item).
CREATE UNIQUE INDEX "Requirement_active_level_value_key" ON "Requirement"("bookingId", COALESCE("programItemId", ''), "vocabularyValueId") WHERE "status" = 'ACTIVE';
