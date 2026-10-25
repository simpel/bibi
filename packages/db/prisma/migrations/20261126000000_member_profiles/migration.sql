-- CreateEnum
CREATE TYPE "ScheduleKind" AS ENUM ('PATTERN', 'SHIFTS', 'CASUAL');

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "scheduleKind" "ScheduleKind" NOT NULL DEFAULT 'PATTERN',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProfileItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "MemberProfileItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberProfile_organizationId_status_idx" ON "MemberProfile"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_id_organizationId_key" ON "MemberProfile"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_memberId_organizationId_key" ON "MemberProfile"("memberId", "organizationId");

-- CreateIndex
CREATE INDEX "MemberProfileItem_organizationId_memberProfileId_idx" ON "MemberProfileItem"("organizationId", "memberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfileItem_itemId_organizationId_key" ON "MemberProfileItem"("itemId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "member_id_organizationId_key" ON "member"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_memberId_organizationId_fkey" FOREIGN KEY ("memberId", "organizationId") REFERENCES "member"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfileItem" ADD CONSTRAINT "MemberProfileItem_memberProfileId_organizationId_fkey" FOREIGN KEY ("memberProfileId", "organizationId") REFERENCES "MemberProfile"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfileItem" ADD CONSTRAINT "MemberProfileItem_itemId_organizationId_fkey" FOREIGN KEY ("itemId", "organizationId") REFERENCES "Item"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

