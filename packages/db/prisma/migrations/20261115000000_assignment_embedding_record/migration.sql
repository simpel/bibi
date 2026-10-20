-- ADR 0056: Assignment and Embedding reference Record with a composite foreign key.
-- No production data: existing assignments and record index rows are dropped (the seed and the
-- indexer rebuild them).
DELETE FROM "AssignmentFollower";
DELETE FROM "Assignment";
DELETE FROM "Embedding" WHERE "entityType" IN ('item', 'customer', 'contact');

-- DropIndex
DROP INDEX "Assignment_organizationId_subjectType_subjectId_responsibil_key";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "subjectId",
DROP COLUMN "subjectType",
ADD COLUMN     "recordId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Embedding" ADD COLUMN     "recordId" TEXT,
ALTER COLUMN "entityId" DROP NOT NULL;

-- DropEnum
DROP TYPE "AssignmentSubjectType";

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_organizationId_recordId_responsibilityId_key" ON "Assignment"("organizationId", "recordId", "responsibilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_organizationId_recordId_key" ON "Embedding"("organizationId", "recordId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_recordId_organizationId_fkey" FOREIGN KEY ("recordId", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_recordId_organizationId_fkey" FOREIGN KEY ("recordId", "organizationId") REFERENCES "Record"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;


-- The main assignment (no responsibility) is unique per record.
CREATE UNIQUE INDEX "Assignment_main_record_key" ON "Assignment"("organizationId", "recordId") WHERE "responsibilityId" IS NULL;

-- An index row points at a record or at a non-record entity, never both.
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_target_check" CHECK (("recordId" IS NULL) <> ("entityId" IS NULL));
