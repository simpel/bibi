-- Board columns have no colour: only ticket statuses are colour-coded (#492).
ALTER TABLE "BoardPhase" DROP COLUMN "color";
