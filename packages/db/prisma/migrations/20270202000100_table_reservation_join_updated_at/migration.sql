-- Join rows of ADR 0119 follow the convention columns (createdAt, updatedAt, createdBy).
ALTER TABLE "TableCombinationMember" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ReservationRequirement" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
