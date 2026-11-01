-- AlterTable
ALTER TABLE "ItemCustomisationGroup" ADD COLUMN     "split" BOOLEAN NOT NULL DEFAULT false;

-- ADR 0082: an option line has its own quantity only in a split group. Every group starts
-- unsplit, so option lines chosen before this change (which copied their parent's quantity)
-- inherit it again; otherwise a REPLACES option whose copy drifted would leave its parent a
-- remainder on quotes.
UPDATE "Line" SET "quantity" = NULL WHERE "priceEffect" IS NOT NULL AND "quantity" IS NOT NULL;
