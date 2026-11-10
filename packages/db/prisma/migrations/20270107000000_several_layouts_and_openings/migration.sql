-- ADR 0102: several layouts per item and setup, doors and windows as wall openings.
-- Expand only: new enum values, nullable columns, and a unique index dropped.
ALTER TYPE "FloorShape" ADD VALUE 'DOOR';
ALTER TYPE "FloorShape" ADD VALUE 'WINDOW';

ALTER TABLE "FloorElementKind" ADD COLUMN "swingDeg" INTEGER;
ALTER TABLE "FloorElement" ADD COLUMN "swingDeg" INTEGER;
ALTER TABLE "SetupLayout" ADD COLUMN "name" TEXT;

DROP INDEX "SetupLayout_itemId_setupId_key";
