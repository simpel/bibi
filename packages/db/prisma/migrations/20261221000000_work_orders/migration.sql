-- Sheets become work orders (ADR 0092): rename in place, keep every row.

-- Tables and the enum.
ALTER TABLE "Sheet" RENAME TO "WorkOrder";
ALTER TABLE "SheetDefinition" RENAME TO "WorkOrderDefinition";
ALTER TABLE "SheetDefinitionEntityType" RENAME TO "WorkOrderDefinitionEntityType";
ALTER TABLE "SheetDefinitionField" RENAME TO "WorkOrderDefinitionField";
ALTER TABLE "SheetDefinitionVocabulary" RENAME TO "WorkOrderDefinitionVocabulary";
ALTER TABLE "SheetRecipient" RENAME TO "WorkOrderRecipient";
ALTER TYPE "SheetRecipientRole" RENAME TO "WorkOrderRecipientRole";

-- Columns.
ALTER TABLE "ItemState" RENAME COLUMN "inSheets" TO "inWorkOrders";
ALTER TABLE "WorkOrderDefinitionEntityType" RENAME COLUMN "sheetDefinitionId" TO "workOrderDefinitionId";
ALTER TABLE "WorkOrderDefinitionField" RENAME COLUMN "sheetDefinitionId" TO "workOrderDefinitionId";
ALTER TABLE "WorkOrderDefinitionVocabulary" RENAME COLUMN "sheetDefinitionId" TO "workOrderDefinitionId";
ALTER TABLE "WorkOrderRecipient" RENAME COLUMN "sheetId" TO "workOrderId";
ALTER TABLE "WorkOrder" RENAME COLUMN "sheetDefinitionId" TO "workOrderDefinitionId";

-- Keys and foreign keys.
ALTER TABLE "WorkOrder" RENAME CONSTRAINT "Sheet_pkey" TO "WorkOrder_pkey";
ALTER TABLE "WorkOrder" RENAME CONSTRAINT "Sheet_responsibilityId_organizationId_fkey" TO "WorkOrder_responsibilityId_organizationId_fkey";
ALTER TABLE "WorkOrder" RENAME CONSTRAINT "Sheet_sheetDefinitionId_organizationId_fkey" TO "WorkOrder_workOrderDefinitionId_organizationId_fkey";
ALTER TABLE "WorkOrder" RENAME CONSTRAINT "Sheet_ticketId_organizationId_fkey" TO "WorkOrder_ticketId_organizationId_fkey";
ALTER TABLE "WorkOrderDefinition" RENAME CONSTRAINT "SheetDefinition_pkey" TO "WorkOrderDefinition_pkey";
ALTER TABLE "WorkOrderDefinition" RENAME CONSTRAINT "SheetDefinition_responsibilityId_organizationId_fkey" TO "WorkOrderDefinition_responsibilityId_organizationId_fkey";
ALTER TABLE "WorkOrderDefinitionEntityType" RENAME CONSTRAINT "SheetDefinitionEntityType_entityTypeId_organizationId_fkey" TO "WorkOrderDefinitionEntityType_entityTypeId_organizationId_fkey";
ALTER TABLE "WorkOrderDefinitionEntityType" RENAME CONSTRAINT "SheetDefinitionEntityType_pkey" TO "WorkOrderDefinitionEntityType_pkey";
ALTER TABLE "WorkOrderDefinitionEntityType" RENAME CONSTRAINT "SheetDefinitionEntityType_sheetDefinitionId_organizationId_fkey" TO "WorkOrderDefinitionEntityType_workOrderDefinitionId_organi_fkey";
ALTER TABLE "WorkOrderDefinitionField" RENAME CONSTRAINT "SheetDefinitionField_fieldId_organizationId_fkey" TO "WorkOrderDefinitionField_fieldId_organizationId_fkey";
ALTER TABLE "WorkOrderDefinitionField" RENAME CONSTRAINT "SheetDefinitionField_pkey" TO "WorkOrderDefinitionField_pkey";
ALTER TABLE "WorkOrderDefinitionField" RENAME CONSTRAINT "SheetDefinitionField_sheetDefinitionId_organizationId_fkey" TO "WorkOrderDefinitionField_workOrderDefinitionId_organizatio_fkey";
ALTER TABLE "WorkOrderDefinitionVocabulary" RENAME CONSTRAINT "SheetDefinitionVocabulary_pkey" TO "WorkOrderDefinitionVocabulary_pkey";
ALTER TABLE "WorkOrderDefinitionVocabulary" RENAME CONSTRAINT "SheetDefinitionVocabulary_sheetDefinitionId_organizationId_fkey" TO "WorkOrderDefinitionVocabulary_workOrderDefinitionId_organi_fkey";
ALTER TABLE "WorkOrderDefinitionVocabulary" RENAME CONSTRAINT "SheetDefinitionVocabulary_vocabularyId_organizationId_fkey" TO "WorkOrderDefinitionVocabulary_vocabularyId_organizationId_fkey";
ALTER TABLE "WorkOrderRecipient" RENAME CONSTRAINT "SheetRecipient_pkey" TO "WorkOrderRecipient_pkey";
ALTER TABLE "WorkOrderRecipient" RENAME CONSTRAINT "SheetRecipient_sheetId_organizationId_fkey" TO "WorkOrderRecipient_workOrderId_organizationId_fkey";

-- Indexes.
ALTER INDEX "SheetDefinitionEntityType_organizationId_entityTypeId_idx" RENAME TO "WorkOrderDefinitionEntityType_organizationId_entityTypeId_idx";
ALTER INDEX "SheetDefinitionEntityType_sheetDefinitionId_entityTypeId_key" RENAME TO "WorkOrderDefinitionEntityType_workOrderDefinitionId_entityT_key";
ALTER INDEX "SheetDefinitionField_organizationId_fieldId_idx" RENAME TO "WorkOrderDefinitionField_organizationId_fieldId_idx";
ALTER INDEX "SheetDefinitionField_sheetDefinitionId_fieldId_key" RENAME TO "WorkOrderDefinitionField_workOrderDefinitionId_fieldId_key";
ALTER INDEX "SheetDefinitionVocabulary_organizationId_vocabularyId_idx" RENAME TO "WorkOrderDefinitionVocabulary_organizationId_vocabularyId_idx";
ALTER INDEX "SheetDefinitionVocabulary_sheetDefinitionId_vocabularyId_key" RENAME TO "WorkOrderDefinitionVocabulary_workOrderDefinitionId_vocabul_key";
ALTER INDEX "SheetDefinition_id_organizationId_key" RENAME TO "WorkOrderDefinition_id_organizationId_key";
ALTER INDEX "SheetDefinition_organizationId_responsibilityId_idx" RENAME TO "WorkOrderDefinition_organizationId_responsibilityId_idx";
ALTER INDEX "SheetDefinition_organizationId_status_idx" RENAME TO "WorkOrderDefinition_organizationId_status_idx";
ALTER INDEX "SheetRecipient_organizationId_userId_idx" RENAME TO "WorkOrderRecipient_organizationId_userId_idx";
ALTER INDEX "SheetRecipient_sheetId_userId_key" RENAME TO "WorkOrderRecipient_workOrderId_userId_key";
ALTER INDEX "Sheet_id_organizationId_key" RENAME TO "WorkOrder_id_organizationId_key";
ALTER INDEX "Sheet_organizationId_responsibilityId_idx" RENAME TO "WorkOrder_organizationId_responsibilityId_idx";
ALTER INDEX "Sheet_organizationId_sheetDefinitionId_idx" RENAME TO "WorkOrder_organizationId_workOrderDefinitionId_idx";
ALTER INDEX "Sheet_organizationId_ticketId_idx" RENAME TO "WorkOrder_organizationId_ticketId_idx";
ALTER INDEX "Sheet_ticketId_sheetDefinitionId_version_key" RENAME TO "WorkOrder_ticketId_workOrderDefinitionId_version_key";

-- Stored permission overrides name the feature (ADR 0050).
UPDATE "PermissionOverride" SET "feature" = 'workOrder' WHERE "feature" = 'sheet';
