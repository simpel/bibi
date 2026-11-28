-- Guests may book from this instant on (the start of the first open day); null = no start.
ALTER TABLE "DiningRoom" ADD COLUMN "openFrom" TIMESTAMP(3);
