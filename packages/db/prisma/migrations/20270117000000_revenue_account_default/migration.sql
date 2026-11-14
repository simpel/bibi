-- ADR 0109: the default revenue account is one row. Expand only: a flag that defaults to false,
-- so every existing row keeps meaning "not the default" and the base account stays in use.
ALTER TABLE "RevenueAccount" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- At most one default row per organization (Prisma cannot express a partial unique index).
CREATE UNIQUE INDEX "RevenueAccount_one_default" ON "RevenueAccount" ("organizationId") WHERE "isDefault";
