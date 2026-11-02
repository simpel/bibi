-- CreateEnum
CREATE TYPE "LineRole" AS ENUM ('PART', 'OPTION', 'ADD_ON');

-- AlterTable
ALTER TABLE "ItemCustomisationGroup" ADD COLUMN     "allowExtras" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "role" "LineRole";

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "role" "LineRole";

-- ADR 0088: every sub-line says what it is. Backfill from the old inference: a price effect
-- means an option line, any other line with a parent is a part line.
UPDATE "Line" SET "role" = 'OPTION' WHERE "priceEffect" IS NOT NULL;
UPDATE "Line" SET "role" = 'PART' WHERE "parentLineId" IS NOT NULL AND "priceEffect" IS NULL;

-- Order lines take their line's role (snapshot); only sub-lines carry a parent.
UPDATE "OrderLine" AS o SET "role" = l."role"
FROM "Line" AS l
WHERE o."lineId" = l."id" AND o."organizationId" = l."organizationId"
  AND o."parentLineId" IS NOT NULL;

-- A role exactly when there is a parent.
ALTER TABLE "Line" ADD CONSTRAINT "Line_role_check"
  CHECK (("role" IS NULL) = ("parentLineId" IS NULL));

-- A price effect only on an option line (replaces the parent-only check).
ALTER TABLE "Line" DROP CONSTRAINT "Line_priceEffect_check";
ALTER TABLE "Line" ADD CONSTRAINT "Line_priceEffect_check"
  CHECK ("priceEffect" IS NULL OR "role" = 'OPTION');

-- An option once per line: add-ons of the same item are allowed.
DROP INDEX "Line_option_once_key";
CREATE UNIQUE INDEX "Line_option_once_key" ON "Line"("parentLineId", "itemId")
  WHERE "role" = 'OPTION' AND "status" = 'ACTIVE';
