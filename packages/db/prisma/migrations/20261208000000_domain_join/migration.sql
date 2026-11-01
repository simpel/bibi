-- Domain join (ADR 0076): verified users with the organization's email domain join as members when
-- they sign in. Expand step only (ADR 0013): two nullable or defaulted columns and a new table.
ALTER TABLE "OrganizationProfile" ADD COLUMN "emailDomain" TEXT;
ALTER TABLE "OrganizationProfile" ADD COLUMN "domainJoin" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "OrganizationProfile_emailDomain_idx" ON "OrganizationProfile"("emailDomain");

CREATE TABLE "KnownMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnownMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnownMember_organizationId_userId_key" ON "KnownMember"("organizationId", "userId");

-- Everyone who is a member today has been one: domain join never adds them back after a removal.
INSERT INTO "KnownMember" ("id", "organizationId", "userId", "createdAt")
SELECT DISTINCT ON (m."organizationId", m."userId")
  'km_' || md5(m."organizationId" || ':' || m."userId"), m."organizationId", m."userId", m."createdAt"
FROM "member" m
ORDER BY m."organizationId", m."userId", m."createdAt";

-- Existing organizations take the domain of their first admin's verified email, the same rule as
-- a new organization. Public mail providers (core `PUBLIC_EMAIL_DOMAINS`) get no domain.
UPDATE "OrganizationProfile" AS p
SET "emailDomain" = first_admin.domain
FROM (
  SELECT DISTINCT ON (m."organizationId")
    m."organizationId",
    lower(split_part(u.email, '@', 2)) AS domain,
    u."emailVerified" AS verified
  FROM "member" m
  JOIN "user" u ON u.id = m."userId"
  WHERE m.role = 'admin'
  ORDER BY m."organizationId", m."createdAt"
) AS first_admin
WHERE p."organizationId" = first_admin."organizationId"
  AND first_admin.verified
  AND first_admin.domain NOT IN (
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.se', 'live.com',
    'live.se', 'msn.com', 'yahoo.com', 'yahoo.se', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
    'proton.me', 'protonmail.com', 'gmx.com', 'gmx.net', 'mail.com', 'telia.com', 'spray.se',
    'bredband.net', 
    'outlook.se', 'hotmail.co.uk', 'live.co.uk', 'yahoo.co.uk', 'ymail.com', 'aim.com', 'gmx.se', 'gmx.de', 'web.de', 'pm.me', 'protonmail.ch', 'fastmail.com', 'tutanota.com', 'tuta.io', 'zoho.com', 'hey.com', 'yandex.com', 'yandex.ru', 'qq.com', '163.com', 'tele2.se', 'comhem.se', 'bahnhof.se', 'glocalnet.net', 'home.se', 'passagen.se', 'swipnet.se',
    'example.com', 'example.se', 'example.org', 'example.net', 'example.test'
  );

-- Invite codes (ADR 0076): set by core `member.invite`, typed in on `/welcome/join`.
ALTER TABLE "invitation" ADD COLUMN "code" TEXT;
CREATE UNIQUE INDEX "invitation_code_key" ON "invitation"("code");

-- Primary organization (ADR 0076): at most one primary membership per user. The partial index is
-- hand-written, so Prisma's differ leaves it alone.
ALTER TABLE "member" ADD COLUMN "primary" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "member_userId_primary_key" ON "member"("userId") WHERE "primary";
