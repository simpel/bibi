-- Order of an item's parts, set from the input order on save (issue #147).
ALTER TABLE "ItemComponent" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ItemComponent" ALTER COLUMN "position" DROP DEFAULT;
