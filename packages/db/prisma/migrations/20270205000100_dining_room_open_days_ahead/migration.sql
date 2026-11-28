-- A rolling window for the whole room: guests may book this many days ahead; null = each sitting's own limit.
ALTER TABLE "DiningRoom" ADD COLUMN "openDaysAhead" INTEGER;
