-- CreateTable
CREATE TABLE "BookingPageList" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingPageId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BookingPageList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingPageList_organizationId_vocabularyId_idx" ON "BookingPageList"("organizationId", "vocabularyId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPageList_id_organizationId_key" ON "BookingPageList"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPageList_bookingPageId_vocabularyId_key" ON "BookingPageList"("bookingPageId", "vocabularyId");

-- AddForeignKey
ALTER TABLE "BookingPageList" ADD CONSTRAINT "BookingPageList_bookingPageId_organizationId_fkey" FOREIGN KEY ("bookingPageId", "organizationId") REFERENCES "BookingPage"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPageList" ADD CONSTRAINT "BookingPageList_vocabularyId_organizationId_fkey" FOREIGN KEY ("vocabularyId", "organizationId") REFERENCES "Vocabulary"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
