-- An item's Lucide icon and image, and a package's image (owned columns, ADR 0063 storage keys).
ALTER TABLE "Item" ADD COLUMN "icon" TEXT;
ALTER TABLE "Item" ADD COLUMN "imageKey" TEXT;
ALTER TABLE "OrderTemplate" ADD COLUMN "imageKey" TEXT;
