-- AlterTable
ALTER TABLE "HoursDay" ADD COLUMN     "memberProfileId" TEXT;

-- AlterTable
ALTER TABLE "HoursException" ADD COLUMN     "memberProfileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "HoursDay_memberProfileId_weekday_key" ON "HoursDay"("memberProfileId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "HoursException_memberProfileId_date_key" ON "HoursException"("memberProfileId", "date");

-- AddForeignKey
ALTER TABLE "HoursDay" ADD CONSTRAINT "HoursDay_memberProfileId_organizationId_fkey" FOREIGN KEY ("memberProfileId", "organizationId") REFERENCES "MemberProfile"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_memberProfileId_organizationId_fkey" FOREIGN KEY ("memberProfileId", "organizationId") REFERENCES "MemberProfile"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;


-- Exactly one owner per row (ADR 0064 rule 10), now venue, item or member profile (#449).
ALTER TABLE "HoursDay" DROP CONSTRAINT "HoursDay_one_owner";
ALTER TABLE "HoursDay" ADD CONSTRAINT "HoursDay_one_owner" CHECK (num_nonnulls("venueId", "itemId", "memberProfileId") = 1);
ALTER TABLE "HoursException" DROP CONSTRAINT "HoursException_one_owner";
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_one_owner" CHECK (num_nonnulls("venueId", "itemId", "memberProfileId") = 1);

-- Each user's global working days become their hours in every organization they belong to
-- (expand only: "UserWorkingHours" stays until a later release stops reading it, ADR 0013).
INSERT INTO "MemberProfile" ("id", "organizationId", "memberId", "updatedAt")
SELECT 'mp' || md5(m."id"), m."organizationId", m."id", now()
FROM "member" AS m
WHERE EXISTS (SELECT 1 FROM "UserWorkingHours" AS w WHERE w."userId" = m."userId")
  AND NOT EXISTS (
    SELECT 1 FROM "MemberProfile" AS mp
    WHERE mp."memberId" = m."id" AND mp."organizationId" = m."organizationId"
  );

INSERT INTO "HoursDay" (
  "id", "organizationId", "memberProfileId", "weekday",
  "startMinute", "endMinute", "breakStartMinute", "breakEndMinute", "updatedAt"
)
SELECT 'hd' || md5(mp."id" || ':' || w."weekday"), mp."organizationId", mp."id", w."weekday",
  w."startMinute", w."endMinute", w."breakStartMinute", w."breakEndMinute", now()
FROM "UserWorkingHours" AS w
JOIN "member" AS m ON m."userId" = w."userId"
JOIN "MemberProfile" AS mp ON mp."memberId" = m."id" AND mp."organizationId" = m."organizationId"
ON CONFLICT DO NOTHING;
