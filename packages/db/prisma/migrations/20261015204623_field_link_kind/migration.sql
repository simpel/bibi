-- AlterEnum
ALTER TYPE "FieldKind" ADD VALUE 'LINK';

-- AlterTable
ALTER TABLE "FieldDefinition" ADD COLUMN     "linkTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "FieldDefinition" ADD CONSTRAINT "FieldDefinition_linkTypeId_organizationId_fkey" FOREIGN KEY ("linkTypeId", "organizationId") REFERENCES "EntityType"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
