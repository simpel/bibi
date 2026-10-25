-- CreateTable
CREATE TABLE "HoursDay" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "venueId" TEXT,
    "itemId" TEXT,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "breakStartMinute" INTEGER,
    "breakEndMinute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "HoursDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoursException" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "venueId" TEXT,
    "itemId" TEXT,
    "date" DATE NOT NULL,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "breakStartMinute" INTEGER,
    "breakEndMinute" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "HoursException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoursDay_organizationId_venueId_idx" ON "HoursDay"("organizationId", "venueId");

-- CreateIndex
CREATE INDEX "HoursDay_organizationId_itemId_idx" ON "HoursDay"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "HoursDay_venueId_weekday_key" ON "HoursDay"("venueId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "HoursDay_itemId_weekday_key" ON "HoursDay"("itemId", "weekday");

-- CreateIndex
CREATE INDEX "HoursException_organizationId_venueId_idx" ON "HoursException"("organizationId", "venueId");

-- CreateIndex
CREATE INDEX "HoursException_organizationId_itemId_idx" ON "HoursException"("organizationId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "HoursException_venueId_date_key" ON "HoursException"("venueId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HoursException_itemId_date_key" ON "HoursException"("itemId", "date");

-- AddForeignKey
ALTER TABLE "HoursDay" ADD CONSTRAINT "HoursDay_venueId_organizationId_fkey" FOREIGN KEY ("venueId", "organizationId") REFERENCES "Venue"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursDay" ADD CONSTRAINT "HoursDay_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_venueId_organizationId_fkey" FOREIGN KEY ("venueId", "organizationId") REFERENCES "Venue"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one owner per row (ADR 0064 rule 10); hand-written, Prisma's differ ignores CHECKs.
ALTER TABLE "HoursDay" ADD CONSTRAINT "HoursDay_one_owner" CHECK (num_nonnulls("venueId", "itemId") = 1);
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_one_owner" CHECK (num_nonnulls("venueId", "itemId") = 1);
