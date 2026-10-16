-- AlterTable
ALTER TABLE "Sheet" ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matches" JSONB NOT NULL DEFAULT '[]';
