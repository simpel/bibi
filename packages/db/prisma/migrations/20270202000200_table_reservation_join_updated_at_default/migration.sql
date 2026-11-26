-- The default only fills existing rows; Prisma's @updatedAt has none.
ALTER TABLE "TableCombinationMember" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ReservationRequirement" ALTER COLUMN "updatedAt" DROP DEFAULT;
