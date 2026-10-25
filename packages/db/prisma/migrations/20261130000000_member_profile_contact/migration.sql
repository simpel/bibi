-- ADR 0072: contact details per organization on the member profile (expand only).
ALTER TABLE "MemberProfile" ADD COLUMN "phone" TEXT;
ALTER TABLE "MemberProfile" ADD COLUMN "email" TEXT;
ALTER TABLE "MemberProfile" ADD COLUMN "avatarKey" TEXT;

-- Prefill from each member's own profile: existing member profiles first …
UPDATE "MemberProfile" AS mp
SET "phone" = up."phone", "avatarKey" = up."avatarKey"
FROM "member" AS m
JOIN "UserProfile" AS up ON up."userId" = m."userId"
WHERE m."id" = mp."memberId" AND m."organizationId" = mp."organizationId";

-- … then a member profile for every member who has a user profile but no member profile yet.
INSERT INTO "MemberProfile" ("id", "organizationId", "memberId", "phone", "avatarKey", "updatedAt")
SELECT 'mp' || md5(m."id"), m."organizationId", m."id", up."phone", up."avatarKey", now()
FROM "member" AS m
JOIN "UserProfile" AS up ON up."userId" = m."userId"
WHERE NOT EXISTS (
  SELECT 1 FROM "MemberProfile" AS mp
  WHERE mp."memberId" = m."id" AND mp."organizationId" = m."organizationId"
);
