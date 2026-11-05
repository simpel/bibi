-- Work order becomes run sheet, ticket becomes order (ADR 0021, 0043, 0054, 0092).
-- Clean cuts across the board.

-- Drop old triggers and functions before table renames
DROP TRIGGER IF EXISTS history_ticket_status ON "TicketStatusChange";
DROP TRIGGER IF EXISTS history_ticket_status_guard ON "Ticket";
DROP TRIGGER IF EXISTS line_occupancy_ticket ON "Ticket";
DROP TRIGGER IF EXISTS line_occupancy_ticket_status ON "TicketStatus";
DROP FUNCTION IF EXISTS history_project_ticket_status();
DROP FUNCTION IF EXISTS line_occupancy_on_ticket();
DROP FUNCTION IF EXISTS line_occupancy_on_ticket_status();
DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";

-- Enum value and type renames
ALTER TYPE "EntityBase" RENAME VALUE 'TICKET' TO 'ORDER';
ALTER TYPE "RecordBase" RENAME VALUE 'TICKET' TO 'ORDER';
ALTER TYPE "RecordBase" RENAME VALUE 'TICKET_TEMPLATE' TO 'ORDER_TEMPLATE';
ALTER TYPE "NotificationKind" RENAME VALUE 'WORK_ORDER_SENT' TO 'RUN_SHEET_SENT';
ALTER TYPE "NotificationKind" RENAME VALUE 'TICKET_STATUS_CHANGED' TO 'ORDER_STATUS_CHANGED';
ALTER TYPE "WorkOrderRecipientRole" RENAME TO "RunSheetRecipientRole";

-- Table renames: WorkOrder -> RunSheet
ALTER TABLE "WorkOrder" RENAME TO "RunSheet";
ALTER TABLE "WorkOrderDefinition" RENAME TO "RunSheetDefinition";
ALTER TABLE "WorkOrderDefinitionEntityType" RENAME TO "RunSheetDefinitionEntityType";
ALTER TABLE "WorkOrderDefinitionField" RENAME TO "RunSheetDefinitionField";
ALTER TABLE "WorkOrderDefinitionVocabulary" RENAME TO "RunSheetDefinitionVocabulary";
ALTER TABLE "WorkOrderRecipient" RENAME TO "RunSheetRecipient";

-- Table renames: Ticket -> Order
ALTER TABLE "Ticket" RENAME TO "Order";
ALTER TABLE "TicketStatus" RENAME TO "OrderStatus";
ALTER TABLE "TicketStatusTransition" RENAME TO "OrderStatusTransition";
ALTER TABLE "TicketStatusGate" RENAME TO "OrderStatusGate";
ALTER TABLE "TicketStatusChange" RENAME TO "OrderStatusChange";
ALTER TABLE "TicketEstimate" RENAME TO "OrderEstimate";
ALTER TABLE "TicketTemplate" RENAME TO "OrderTemplate";
ALTER TABLE "TicketTemplateLine" RENAME TO "OrderTemplateLine";
ALTER TABLE "TicketTemplateLineOption" RENAME TO "OrderTemplateLineOption";

-- Column renames
ALTER TABLE "ItemState" RENAME COLUMN "inWorkOrders" TO "inRunSheets";

ALTER TABLE "RunSheetDefinitionEntityType" RENAME COLUMN "workOrderDefinitionId" TO "runSheetDefinitionId";
ALTER TABLE "RunSheetDefinitionField" RENAME COLUMN "workOrderDefinitionId" TO "runSheetDefinitionId";
ALTER TABLE "RunSheetDefinitionVocabulary" RENAME COLUMN "workOrderDefinitionId" TO "runSheetDefinitionId";
ALTER TABLE "RunSheetRecipient" RENAME COLUMN "workOrderId" TO "runSheetId";
ALTER TABLE "RunSheet" RENAME COLUMN "workOrderDefinitionId" TO "runSheetDefinitionId";
ALTER TABLE "RunSheet" RENAME COLUMN "ticketId" TO "orderId";

ALTER TABLE "OrderStatusChange" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "OrderEstimate" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "AlternativeGroup" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "InboundEmail" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "InboundMessage" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Line" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Notification" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Notification" RENAME COLUMN "workOrderId" TO "runSheetId";
ALTER TABLE "Payment" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Deposit" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Invoice" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Quote" RENAME COLUMN "ticketId" TO "orderId";
ALTER TABLE "Requirement" RENAME COLUMN "ticketId" TO "orderId";

-- Constraint renames: RunSheet & definitions
ALTER TABLE "RunSheet" RENAME CONSTRAINT "WorkOrder_pkey" TO "RunSheet_pkey";
ALTER TABLE "RunSheet" RENAME CONSTRAINT "WorkOrder_responsibilityId_organizationId_fkey" TO "RunSheet_responsibilityId_organizationId_fkey";
ALTER TABLE "RunSheet" RENAME CONSTRAINT "WorkOrder_workOrderDefinitionId_organizationId_fkey" TO "RunSheet_runSheetDefinitionId_organizationId_fkey";
ALTER TABLE "RunSheet" RENAME CONSTRAINT "WorkOrder_ticketId_organizationId_fkey" TO "RunSheet_orderId_organizationId_fkey";
ALTER TABLE "RunSheetDefinition" RENAME CONSTRAINT "WorkOrderDefinition_pkey" TO "RunSheetDefinition_pkey";
ALTER TABLE "RunSheetDefinition" RENAME CONSTRAINT "WorkOrderDefinition_responsibilityId_organizationId_fkey" TO "RunSheetDefinition_responsibilityId_organizationId_fkey";
ALTER TABLE "RunSheetDefinitionEntityType" RENAME CONSTRAINT "WorkOrderDefinitionEntityType_entityTypeId_organizationId_fkey" TO "RunSheetDefinitionEntityType_entityTypeId_organizationId_fkey";
ALTER TABLE "RunSheetDefinitionEntityType" RENAME CONSTRAINT "WorkOrderDefinitionEntityType_pkey" TO "RunSheetDefinitionEntityType_pkey";
ALTER TABLE "RunSheetDefinitionEntityType" RENAME CONSTRAINT "WorkOrderDefinitionEntityType_workOrderDefinitionId_organi_fkey" TO "RunSheetDefinitionEntityType_runSheetDefinitionId_organi_fkey";
ALTER TABLE "RunSheetDefinitionField" RENAME CONSTRAINT "WorkOrderDefinitionField_fieldId_organizationId_fkey" TO "RunSheetDefinitionField_fieldId_organizationId_fkey";
ALTER TABLE "RunSheetDefinitionField" RENAME CONSTRAINT "WorkOrderDefinitionField_pkey" TO "RunSheetDefinitionField_pkey";
ALTER TABLE "RunSheetDefinitionField" RENAME CONSTRAINT "WorkOrderDefinitionField_workOrderDefinitionId_organizatio_fkey" TO "RunSheetDefinitionField_runSheetDefinitionId_organizatio_fkey";
ALTER TABLE "RunSheetDefinitionVocabulary" RENAME CONSTRAINT "WorkOrderDefinitionVocabulary_pkey" TO "RunSheetDefinitionVocabulary_pkey";
ALTER TABLE "RunSheetDefinitionVocabulary" RENAME CONSTRAINT "WorkOrderDefinitionVocabulary_workOrderDefinitionId_organi_fkey" TO "RunSheetDefinitionVocabulary_runSheetDefinitionId_organi_fkey";
ALTER TABLE "RunSheetDefinitionVocabulary" RENAME CONSTRAINT "WorkOrderDefinitionVocabulary_vocabularyId_organizationId_fkey" TO "RunSheetDefinitionVocabulary_vocabularyId_organizationId_fkey";
ALTER TABLE "RunSheetRecipient" RENAME CONSTRAINT "WorkOrderRecipient_pkey" TO "RunSheetRecipient_pkey";
ALTER TABLE "RunSheetRecipient" RENAME CONSTRAINT "WorkOrderRecipient_workOrderId_organizationId_fkey" TO "RunSheetRecipient_runSheetId_organizationId_fkey";

-- Constraint renames: Notification
ALTER TABLE "Notification" RENAME CONSTRAINT "Notification_ticketId_organizationId_fkey" TO "Notification_orderId_organizationId_fkey";
ALTER TABLE "Notification" RENAME CONSTRAINT "Notification_workOrderId_organizationId_fkey" TO "Notification_runSheetId_organizationId_fkey";

-- Constraint renames: other tables referencing Order
ALTER TABLE "AlternativeGroup" RENAME CONSTRAINT "AlternativeGroup_ticketId_organizationId_fkey" TO "AlternativeGroup_orderId_organizationId_fkey";
ALTER TABLE "InboundEmail" RENAME CONSTRAINT "InboundEmail_ticketId_organizationId_fkey" TO "InboundEmail_orderId_organizationId_fkey";
ALTER TABLE "InboundMessage" RENAME CONSTRAINT "InboundMessage_ticketId_organizationId_fkey" TO "InboundMessage_orderId_organizationId_fkey";
ALTER TABLE "Line" RENAME CONSTRAINT "Line_ticketId_organizationId_fkey" TO "Line_orderId_organizationId_fkey";
ALTER TABLE "Payment" RENAME CONSTRAINT "Payment_ticketId_organizationId_fkey" TO "Payment_orderId_organizationId_fkey";
ALTER TABLE "Deposit" RENAME CONSTRAINT "Deposit_ticketId_organizationId_fkey" TO "Deposit_orderId_organizationId_fkey";
ALTER TABLE "Invoice" RENAME CONSTRAINT "Invoice_ticketId_organizationId_fkey" TO "Invoice_orderId_organizationId_fkey";
ALTER TABLE "Quote" RENAME CONSTRAINT "Quote_ticketId_organizationId_fkey" TO "Quote_orderId_organizationId_fkey";
ALTER TABLE "Requirement" RENAME CONSTRAINT "Requirement_ticketId_organizationId_fkey" TO "Requirement_orderId_organizationId_fkey";

-- Constraint renames: Order
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_pkey" TO "Order_pkey";
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_id_organizationId_fkey" TO "Order_id_organizationId_fkey";
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_customerId_organizationId_fkey" TO "Order_customerId_organizationId_fkey";
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_contactId_organizationId_fkey" TO "Order_contactId_organizationId_fkey";
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_entityTypeId_organizationId_fkey" TO "Order_entityTypeId_organizationId_fkey";
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_statusId_organizationId_fkey" TO "Order_statusId_organizationId_fkey";
ALTER TABLE "Order" RENAME CONSTRAINT "Ticket_desired_period_check" TO "Order_desired_period_check";

-- Constraint renames: OrderStatus
ALTER TABLE "OrderStatus" RENAME CONSTRAINT "TicketStatus_pkey" TO "OrderStatus_pkey";

-- Constraint renames: OrderStatusTransition
ALTER TABLE "OrderStatusTransition" RENAME CONSTRAINT "TicketStatusTransition_pkey" TO "OrderStatusTransition_pkey";
ALTER TABLE "OrderStatusTransition" RENAME CONSTRAINT "TicketStatusTransition_fromStatusId_organizationId_fkey" TO "OrderStatusTransition_fromStatusId_organizationId_fkey";
ALTER TABLE "OrderStatusTransition" RENAME CONSTRAINT "TicketStatusTransition_toStatusId_organizationId_fkey" TO "OrderStatusTransition_toStatusId_organizationId_fkey";

-- Constraint renames: OrderStatusGate
ALTER TABLE "OrderStatusGate" RENAME CONSTRAINT "TicketStatusGate_pkey" TO "OrderStatusGate_pkey";
ALTER TABLE "OrderStatusGate" RENAME CONSTRAINT "TicketStatusGate_toStatusId_organizationId_fkey" TO "OrderStatusGate_toStatusId_organizationId_fkey";
ALTER TABLE "OrderStatusGate" RENAME CONSTRAINT "TicketStatusGate_fromStatusId_organizationId_fkey" TO "OrderStatusGate_fromStatusId_organizationId_fkey";

-- Constraint renames: OrderStatusChange
ALTER TABLE "OrderStatusChange" RENAME CONSTRAINT "TicketStatusChange_pkey" TO "OrderStatusChange_pkey";
ALTER TABLE "OrderStatusChange" RENAME CONSTRAINT "TicketStatusChange_fromStatusId_organizationId_fkey" TO "OrderStatusChange_fromStatusId_organizationId_fkey";
ALTER TABLE "OrderStatusChange" RENAME CONSTRAINT "TicketStatusChange_toStatusId_organizationId_fkey" TO "OrderStatusChange_toStatusId_organizationId_fkey";
ALTER TABLE "OrderStatusChange" RENAME CONSTRAINT "TicketStatusChange_ticketId_organizationId_fkey" TO "OrderStatusChange_orderId_organizationId_fkey";

-- Constraint renames: OrderEstimate
ALTER TABLE "OrderEstimate" RENAME CONSTRAINT "TicketEstimate_pkey" TO "OrderEstimate_pkey";
ALTER TABLE "OrderEstimate" RENAME CONSTRAINT "TicketEstimate_ticketId_organizationId_fkey" TO "OrderEstimate_orderId_organizationId_fkey";

-- Constraint renames: OrderTemplate
ALTER TABLE "OrderTemplate" RENAME CONSTRAINT "TicketTemplate_pkey" TO "OrderTemplate_pkey";
ALTER TABLE "OrderTemplate" RENAME CONSTRAINT "TicketTemplate_id_organizationId_fkey" TO "OrderTemplate_id_organizationId_fkey";
ALTER TABLE "OrderTemplate" RENAME CONSTRAINT "TicketTemplate_entityTypeId_organizationId_fkey" TO "OrderTemplate_entityTypeId_organizationId_fkey";
ALTER TABLE "OrderTemplate" RENAME CONSTRAINT "TicketTemplate_statusId_organizationId_fkey" TO "OrderTemplate_statusId_organizationId_fkey";

-- Constraint renames: OrderTemplateLine
ALTER TABLE "OrderTemplateLine" RENAME CONSTRAINT "TicketTemplateLine_pkey" TO "OrderTemplateLine_pkey";
ALTER TABLE "OrderTemplateLine" RENAME CONSTRAINT "TicketTemplateLine_templateId_organizationId_fkey" TO "OrderTemplateLine_templateId_organizationId_fkey";
ALTER TABLE "OrderTemplateLine" RENAME CONSTRAINT "TicketTemplateLine_entityTypeId_organizationId_fkey" TO "OrderTemplateLine_entityTypeId_organizationId_fkey";
ALTER TABLE "OrderTemplateLine" RENAME CONSTRAINT "TicketTemplateLine_itemId_organizationId_fkey" TO "OrderTemplateLine_itemId_organizationId_fkey";
ALTER TABLE "OrderTemplateLine" RENAME CONSTRAINT "TicketTemplateLine_setupId_organizationId_fkey" TO "OrderTemplateLine_setupId_organizationId_fkey";

-- Constraint renames: OrderTemplateLineOption
ALTER TABLE "OrderTemplateLineOption" RENAME CONSTRAINT "TicketTemplateLineOption_pkey" TO "OrderTemplateLineOption_pkey";
ALTER TABLE "OrderTemplateLineOption" RENAME CONSTRAINT "TicketTemplateLineOption_templateLineId_organizationId_fkey" TO "OrderTemplateLineOption_templateLineId_organizationId_fkey";
ALTER TABLE "OrderTemplateLineOption" RENAME CONSTRAINT "TicketTemplateLineOption_itemId_organizationId_fkey" TO "OrderTemplateLineOption_itemId_organizationId_fkey";

-- Index renames: RunSheet & definitions
ALTER INDEX "WorkOrderDefinitionEntityType_organizationId_entityTypeId_idx" RENAME TO "RunSheetDefinitionEntityType_organizationId_entityTypeId_idx";
ALTER INDEX "WorkOrderDefinitionEntityType_workOrderDefinitionId_entityT_key" RENAME TO "RunSheetDefinitionEntityType_runSheetDefinitionId_entityT_key";
ALTER INDEX "WorkOrderDefinitionField_organizationId_fieldId_idx" RENAME TO "RunSheetDefinitionField_organizationId_fieldId_idx";
ALTER INDEX "WorkOrderDefinitionField_workOrderDefinitionId_fieldId_key" RENAME TO "RunSheetDefinitionField_runSheetDefinitionId_fieldId_key";
ALTER INDEX "WorkOrderDefinitionVocabulary_organizationId_vocabularyId_idx" RENAME TO "RunSheetDefinitionVocabulary_organizationId_vocabularyId_idx";
ALTER INDEX "WorkOrderDefinitionVocabulary_workOrderDefinitionId_vocabul_key" RENAME TO "RunSheetDefinitionVocabulary_runSheetDefinitionId_vocabul_key";
ALTER INDEX "WorkOrderDefinition_id_organizationId_key" RENAME TO "RunSheetDefinition_id_organizationId_key";
ALTER INDEX "WorkOrderDefinition_organizationId_responsibilityId_idx" RENAME TO "RunSheetDefinition_organizationId_responsibilityId_idx";
ALTER INDEX "WorkOrderDefinition_organizationId_status_idx" RENAME TO "RunSheetDefinition_organizationId_status_idx";
ALTER INDEX "WorkOrderRecipient_organizationId_userId_idx" RENAME TO "RunSheetRecipient_organizationId_userId_idx";
ALTER INDEX "WorkOrderRecipient_workOrderId_userId_key" RENAME TO "RunSheetRecipient_runSheetId_userId_key";
ALTER INDEX "WorkOrder_id_organizationId_key" RENAME TO "RunSheet_id_organizationId_key";
ALTER INDEX "WorkOrder_organizationId_responsibilityId_idx" RENAME TO "RunSheet_organizationId_responsibilityId_idx";
ALTER INDEX "WorkOrder_organizationId_workOrderDefinitionId_idx" RENAME TO "RunSheet_organizationId_runSheetDefinitionId_idx";
ALTER INDEX "WorkOrder_organizationId_ticketId_idx" RENAME TO "RunSheet_organizationId_orderId_idx";
ALTER INDEX "WorkOrder_ticketId_workOrderDefinitionId_version_key" RENAME TO "RunSheet_orderId_runSheetDefinitionId_version_key";
ALTER INDEX "WorkOrder_organizationId_current_idx" RENAME TO "RunSheet_organizationId_current_idx";

-- Index renames: other tables referencing Order
ALTER INDEX "AlternativeGroup_organizationId_ticketId_idx" RENAME TO "AlternativeGroup_organizationId_orderId_idx";
ALTER INDEX "InboundEmail_organizationId_ticketId_receivedAt_idx" RENAME TO "InboundEmail_organizationId_orderId_receivedAt_idx";
ALTER INDEX "InboundMessage_organizationId_ticketId_receivedAt_idx" RENAME TO "InboundMessage_organizationId_orderId_receivedAt_idx";
ALTER INDEX "InboundMessage_organizationId_status_ticketId_readAt_receiv_idx" RENAME TO "InboundMessage_organizationId_status_orderId_readAt_receiv_idx";
ALTER INDEX "Line_organizationId_ticketId_startsAt_idx" RENAME TO "Line_organizationId_orderId_startsAt_idx";
ALTER INDEX "Payment_organizationId_ticketId_idx" RENAME TO "Payment_organizationId_orderId_idx";
ALTER INDEX "Deposit_organizationId_ticketId_idx" RENAME TO "Deposit_organizationId_orderId_idx";
ALTER INDEX "Invoice_organizationId_ticketId_idx" RENAME TO "Invoice_organizationId_orderId_idx";
ALTER INDEX "Invoice_ticketId_open_key" RENAME TO "Invoice_orderId_open_key";
ALTER INDEX "Quote_organizationId_ticketId_idx" RENAME TO "Quote_organizationId_orderId_idx";
ALTER INDEX "Quote_ticketId_version_key" RENAME TO "Quote_orderId_version_key";
ALTER INDEX "Requirement_organizationId_ticketId_status_idx" RENAME TO "Requirement_organizationId_orderId_status_idx";

DROP INDEX IF EXISTS "Requirement_active_level_value_key";
CREATE UNIQUE INDEX "Requirement_active_level_value_key" ON "Requirement"("orderId", COALESCE("lineId", ''), "vocabularyValueId") WHERE "status" = 'ACTIVE';

-- Index renames: Order
ALTER INDEX "Ticket_id_organizationId_key" RENAME TO "Order_id_organizationId_key";
ALTER INDEX "Ticket_organizationId_reference_key" RENAME TO "Order_organizationId_reference_key";
ALTER INDEX "Ticket_organizationId_status_desiredStartsAt_idx" RENAME TO "Order_organizationId_status_desiredStartsAt_idx";
ALTER INDEX "Ticket_organizationId_customerId_idx" RENAME TO "Order_organizationId_customerId_idx";
ALTER INDEX "Ticket_organizationId_statusId_idx" RENAME TO "Order_organizationId_statusId_idx";
ALTER INDEX "Ticket_organizationId_desiredStartsAt_idx" RENAME TO "Order_organizationId_desiredStartsAt_idx";
ALTER INDEX "Ticket_organizationId_entityTypeId_idx" RENAME TO "Order_organizationId_entityTypeId_idx";
ALTER INDEX "Ticket_organizationId_estimatedHeadcount_idx" RENAME TO "Order_organizationId_estimatedHeadcount_idx";
ALTER INDEX "Ticket_organizationId_holdsUntil_idx" RENAME TO "Order_organizationId_holdsUntil_idx";
ALTER INDEX "Ticket_organizationId_createdAt_idx" RENAME TO "Order_organizationId_createdAt_idx";
ALTER INDEX "Ticket_organizationId_title_idx" RENAME TO "Order_organizationId_title_idx";
ALTER INDEX "Ticket_organizationId_intakeKey_key" RENAME TO "Order_organizationId_intakeKey_key";

-- Index renames: OrderStatus
ALTER INDEX "TicketStatus_id_organizationId_key" RENAME TO "OrderStatus_id_organizationId_key";
ALTER INDEX "TicketStatus_organizationId_status_position_idx" RENAME TO "OrderStatus_organizationId_status_position_idx";
ALTER INDEX "TicketStatus_one_entry_key" RENAME TO "OrderStatus_one_entry_key";
ALTER INDEX "TicketStatus_one_event_key" RENAME TO "OrderStatus_one_event_key";

-- Index renames: OrderStatusTransition
ALTER INDEX "TicketStatusTransition_id_organizationId_key" RENAME TO "OrderStatusTransition_id_organizationId_key";
ALTER INDEX "TicketStatusTransition_fromStatusId_toStatusId_key" RENAME TO "OrderStatusTransition_fromStatusId_toStatusId_key";
ALTER INDEX "TicketStatusTransition_organizationId_fromStatusId_idx" RENAME TO "OrderStatusTransition_organizationId_fromStatusId_idx";

-- Index renames: OrderStatusGate
ALTER INDEX "TicketStatusGate_organizationId_toStatusId_idx" RENAME TO "OrderStatusGate_organizationId_toStatusId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "OrderStatusGate_toStatusId_fromStatusId_key_key" ON "OrderStatusGate"("toStatusId", "fromStatusId", "key") NULLS NOT DISTINCT;

-- Index and sequence renames: OrderStatusChange
ALTER INDEX "TicketStatusChange_seq_key" RENAME TO "OrderStatusChange_seq_key";
ALTER INDEX "TicketStatusChange_organizationId_ticketId_seq_idx" RENAME TO "OrderStatusChange_organizationId_orderId_seq_idx";
ALTER INDEX "TicketStatusChange_organizationId_toStatusId_changedAt_idx" RENAME TO "OrderStatusChange_organizationId_toStatusId_changedAt_idx";
ALTER SEQUENCE "TicketStatusChange_seq_seq" RENAME TO "OrderStatusChange_seq_seq";

-- Index and sequence renames: OrderEstimate
ALTER INDEX "TicketEstimate_seq_key" RENAME TO "OrderEstimate_seq_key";
ALTER INDEX "TicketEstimate_organizationId_ticketId_seq_idx" RENAME TO "OrderEstimate_organizationId_orderId_seq_idx";

-- Index renames: OrderTemplate
ALTER INDEX "TicketTemplate_id_organizationId_key" RENAME TO "OrderTemplate_id_organizationId_key";
ALTER INDEX "TicketTemplate_active_name_key" RENAME TO "OrderTemplate_active_name_key";
ALTER INDEX "TicketTemplate_organizationId_status_idx" RENAME TO "OrderTemplate_organizationId_status_idx";
ALTER INDEX "TicketTemplate_organizationId_statusId_idx" RENAME TO "OrderTemplate_organizationId_statusId_idx";

-- Index renames: OrderTemplateLine
ALTER INDEX "TicketTemplateLine_id_organizationId_key" RENAME TO "OrderTemplateLine_id_organizationId_key";
ALTER INDEX "TicketTemplateLine_organizationId_templateId_position_idx" RENAME TO "OrderTemplateLine_organizationId_templateId_position_idx";
ALTER INDEX "TicketTemplateLine_organizationId_itemId_idx" RENAME TO "OrderTemplateLine_organizationId_itemId_idx";

-- Index renames: OrderTemplateLineOption
ALTER INDEX "TicketTemplateLineOption_id_organizationId_key" RENAME TO "OrderTemplateLineOption_id_organizationId_key";
ALTER INDEX "TicketTemplateLineOption_organizationId_itemId_idx" RENAME TO "OrderTemplateLineOption_organizationId_itemId_idx";
ALTER INDEX "TicketTemplateLineOption_templateLineId_itemId_key" RENAME TO "OrderTemplateLineOption_templateLineId_itemId_key";

-- Permission overrides
UPDATE "PermissionOverride" SET "feature" = 'order' WHERE "feature" = 'ticket';
UPDATE "PermissionOverride" SET "feature" = 'runSheet' WHERE "feature" = 'workOrder';

-- BEGIN packages/db/sql/domain_history.sql
-- Domain history is owned data; the current status and line state are its projections (ADR 0054).
-- This file is the source of the functions and triggers; the migration `domain_history` applies
-- it verbatim (`packages/db/test/line-holds-sql.test.ts` keeps the two in step).
--
-- Inserting a `OrderStatusChange` sets `Order.statusId` to its `toStatusId`; inserting a
-- `LineStateChange` sets `Line.stateId` to its `toStateId`. Both updates fire the line holds
-- triggers (ADR 0053, `sync_line_occupancy.sql`) in the same transaction, so an overlap still
-- fails the whole change with `line_occupancy_conflict`.
--
-- A change is written against the value it was read from: when `from…Id` is no longer the
-- current value (a concurrent change won), the insert fails with the message `history_stale`,
-- which core maps to CONFLICT. The first row of a record (`from…Id` null on a fresh record)
-- confirms the value the record was inserted with.
--
-- Nothing else may change `Order.statusId` or `Line.stateId` after the insert: a guard trigger
-- refuses any update of them outside the projection (`history_projection_only`).

CREATE OR REPLACE FUNCTION history_project_order_status() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_status text;
BEGIN
  SELECT t."statusId" INTO current_status FROM "Order" t
   WHERE t."id" = NEW."orderId" AND t."organizationId" = NEW."organizationId" FOR UPDATE;
  IF NEW."fromStatusId" IS DISTINCT FROM current_status
     AND NOT (NEW."fromStatusId" IS NULL AND current_status = NEW."toStatusId") THEN
    RAISE EXCEPTION USING MESSAGE = 'history_stale', DETAIL = NEW."orderId";
  END IF;
  IF current_status IS DISTINCT FROM NEW."toStatusId" THEN
    PERFORM set_config('bibi.history_projection', 'on', true);
    UPDATE "Order" SET "statusId" = NEW."toStatusId", "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = NEW."orderId" AND "organizationId" = NEW."organizationId";
    PERFORM set_config('bibi.history_projection', 'off', true);
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_project_line_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_state text;
BEGIN
  SELECT l."stateId" INTO current_state FROM "Line" l
   WHERE l."id" = NEW."lineId" AND l."organizationId" = NEW."organizationId" FOR UPDATE;
  IF NEW."fromStateId" IS DISTINCT FROM current_state
     AND NOT (NEW."fromStateId" IS NULL AND current_state IS NOT DISTINCT FROM NEW."toStateId") THEN
    RAISE EXCEPTION USING MESSAGE = 'history_stale', DETAIL = NEW."lineId";
  END IF;
  IF current_state IS DISTINCT FROM NEW."toStateId" THEN
    PERFORM set_config('bibi.history_projection', 'on', true);
    UPDATE "Line" SET "stateId" = NEW."toStateId", "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = NEW."lineId" AND "organizationId" = NEW."organizationId";
    PERFORM set_config('bibi.history_projection', 'off', true);
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_projection_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('bibi.history_projection', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION USING MESSAGE = 'history_projection_only',
      DETAIL = TG_TABLE_NAME || ' ' || NEW."id";
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS history_order_status ON "OrderStatusChange";
CREATE TRIGGER history_order_status AFTER INSERT ON "OrderStatusChange"
  FOR EACH ROW EXECUTE FUNCTION history_project_order_status();

DROP TRIGGER IF EXISTS history_line_state ON "LineStateChange";
CREATE TRIGGER history_line_state AFTER INSERT ON "LineStateChange"
  FOR EACH ROW EXECUTE FUNCTION history_project_line_state();

DROP TRIGGER IF EXISTS history_order_status_guard ON "Order";
CREATE TRIGGER history_order_status_guard BEFORE UPDATE ON "Order"
  FOR EACH ROW WHEN (OLD."statusId" IS DISTINCT FROM NEW."statusId")
  EXECUTE FUNCTION history_projection_only();

DROP TRIGGER IF EXISTS history_line_state_guard ON "Line";
CREATE TRIGGER history_line_state_guard BEFORE UPDATE ON "Line"
  FOR EACH ROW WHEN (OLD."stateId" IS DISTINCT FROM NEW."stateId")
  EXECUTE FUNCTION history_projection_only();
-- END packages/db/sql/domain_history.sql

-- BEGIN packages/db/sql/sync_line_occupancy.sql
-- Line holds are a projection of line state (ADR 0053, 0059). This file is the source of the
-- functions and triggers; the latest migration that includes it applies it verbatim
-- (`packages/db/test/line-holds-sql.test.ts` keeps the two in step).
--
-- A line holds its item when: the line and its order are ACTIVE, the order's status does not
-- close it, the line is timed, its item's type is BOOKABLE and its state is not released and
-- holds (SOFT or HARD). It then has one HOLD row of the state's kind for [startsAt, endsAt), a
-- SETUP row right before and a TEARDOWN row right after, each of the same kind and only when its
-- minutes are above zero. Setup minutes are the line's, else the item's, else the type's, and
-- the larger of that and the setup's changeover time (never the sum); teardown minutes are the
-- line's, else the item's, else the type's. SOFT buffers never block, like SOFT holds.
--
-- A held line also holds the unit of every active, filled allocation (`LineAllocation`) of an
-- active demand whose unit is active and of a BOOKABLE type, for each of the demand's windows
-- that is not empty: SETUP as a SETUP row, BOOKING as a HOLD row and TEARDOWN as a TEARDOWN
-- row, with the line's times and hold kind and the allocation's id. The unit's own buffers do
-- not apply. Rows that no longer hold are ARCHIVED; one row per (lineId, itemId, type) is kept and
-- reactivated.
--
-- An overlap rejected by "Occupancy_no_overlap" is raised again as SQLSTATE 23P01 with the
-- message `line_occupancy_conflict` and the conflicting line ids, comma separated, in DETAIL.
-- Core maps it to CONFLICT with one issue per line (`lines.<id>`).

DROP FUNCTION IF EXISTS sync_line_occupancy_row(text, "OccupancyType", "HoldKind",
  timestamp(3), timestamp(3));
DROP FUNCTION IF EXISTS sync_line_occupancy_row(text, text, "OccupancyType", "HoldKind",
  timestamp(3), timestamp(3));

-- Writes one active line row, reactivating the line's row for the same item and window.
CREATE OR REPLACE FUNCTION sync_line_occupancy_row(target_line_id text, item_id text,
  allocation_id text, kind "OccupancyType", hold "HoldKind", starts_at timestamp(3),
  ends_at timestamp(3))
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "Occupancy" ("id", "organizationId", "itemId", "type", "holdKind", "startsAt",
    "endsAt", "lineId", "allocationId", "status", "createdAt", "updatedAt", "createdBy")
  SELECT gen_random_uuid()::text, l."organizationId", item_id, kind, hold, starts_at, ends_at,
    l."id", allocation_id, 'ACTIVE', now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC',
    l."createdBy"
    FROM "Line" l WHERE l."id" = target_line_id
  ON CONFLICT ("lineId", "itemId", "type") DO UPDATE
    SET "holdKind" = EXCLUDED."holdKind", "startsAt" = EXCLUDED."startsAt",
        "endsAt" = EXCLUDED."endsAt", "allocationId" = EXCLUDED."allocationId",
        "status" = 'ACTIVE', "updatedAt" = (now() AT TIME ZONE 'UTC')
    WHERE ("Occupancy"."holdKind", "Occupancy"."startsAt", "Occupancy"."endsAt",
           "Occupancy"."allocationId", "Occupancy"."status")
      IS DISTINCT FROM
          (EXCLUDED."holdKind", EXCLUDED."startsAt", EXCLUDED."endsAt", EXCLUDED."allocationId",
           'ACTIVE'::"RecordStatus");
END $$;

-- The rows one line should have: its own item's HOLD, SETUP and TEARDOWN, then the windows of
-- its allocated units. Empty when the line holds nothing.
CREATE OR REPLACE FUNCTION line_occupancy_wanted(target_line_id text)
RETURNS TABLE (item_id text, allocation_id text, kind "OccupancyType", hold "HoldKind",
  starts_at timestamp(3), ends_at timestamp(3))
LANGUAGE sql STABLE AS $$
  WITH held AS (
    SELECT l."id", l."organizationId", l."itemId", l."startsAt", l."endsAt", s."hold",
           l."startsAt" - make_interval(mins => GREATEST(
             COALESCE(l."setupMinutes", i."setupMinutes", et."setupMinutes", 0),
             COALESCE(su."changeoverMinutes", 0))) AS setup_from,
           l."endsAt" + make_interval(mins =>
             COALESCE(l."teardownMinutes", i."teardownMinutes", et."teardownMinutes", 0))
             AS teardown_to
      FROM "Line" l
      JOIN "Order" t ON t."id" = l."orderId" AND t."organizationId" = l."organizationId"
      JOIN "OrderStatus" p ON p."id" = t."statusId" AND p."organizationId" = t."organizationId"
      JOIN "Item" i ON i."id" = l."itemId" AND i."organizationId" = l."organizationId"
      JOIN "EntityType" et ON et."id" = i."entityTypeId"
        AND et."organizationId" = i."organizationId"
      JOIN "ItemState" s ON s."id" = l."stateId" AND s."organizationId" = l."organizationId"
      LEFT JOIN "Setup" su ON su."id" = l."setupId" AND su."organizationId" = l."organizationId"
     WHERE l."id" = target_line_id
       AND l."status" = 'ACTIVE' AND t."status" = 'ACTIVE' AND NOT p."closes"
       AND l."startsAt" IS NOT NULL AND l."endsAt" IS NOT NULL
       AND 'BOOKABLE' = ANY (et."capabilities")
       AND NOT s."released" AND s."hold" <> 'NONE'
  ),
  windows AS (
    SELECT h.*, w.kind, w.demand_window, w.starts_at, w.ends_at
      FROM held h
     CROSS JOIN LATERAL (VALUES
       ('SETUP'::"OccupancyType", 'SETUP'::"DemandWindow", h.setup_from, h."startsAt"),
       ('HOLD'::"OccupancyType", 'BOOKING'::"DemandWindow", h."startsAt", h."endsAt"),
       ('TEARDOWN'::"OccupancyType", 'TEARDOWN'::"DemandWindow", h."endsAt", h.teardown_to))
       AS w(kind, demand_window, starts_at, ends_at)
     WHERE w.ends_at > w.starts_at
  )
  SELECT w."itemId", NULL::text, w.kind, w."hold", w.starts_at, w.ends_at FROM windows w
  UNION ALL
  SELECT a."unitId", a."id", w.kind, w."hold", w.starts_at, w.ends_at
    FROM windows w
    JOIN "LineAllocation" a ON a."lineId" = w."id" AND a."organizationId" = w."organizationId"
    JOIN "ItemDemand" d ON d."id" = a."demandId" AND d."organizationId" = a."organizationId"
    JOIN "Item" u ON u."id" = a."unitId" AND u."organizationId" = a."organizationId"
    JOIN "EntityType" ut ON ut."id" = u."entityTypeId" AND ut."organizationId" = u."organizationId"
   WHERE a."status" = 'ACTIVE' AND d."status" = 'ACTIVE' AND u."status" = 'ACTIVE'
     AND a."unitId" <> w."itemId"
     AND 'BOOKABLE' = ANY (ut."capabilities")
     AND w.demand_window = ANY (d."windows")
$$;

-- Derives one line's rows (`line_occupancy_wanted`). Raises `line_occupancy_conflict` with the
-- line id on an overlap.
CREATE OR REPLACE FUNCTION sync_line_occupancy(target_line_id text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  wanted record;
BEGIN
  -- Every row that is not wanted exactly as it is goes first, so a line moving its rows never
  -- collides with its own old rows.
  UPDATE "Occupancy" o SET "status" = 'ARCHIVED', "updatedAt" = (now() AT TIME ZONE 'UTC')
   WHERE o."lineId" = target_line_id AND o."status" <> 'ARCHIVED'
     AND (o."itemId", COALESCE(o."allocationId", ''), o."type", o."holdKind", o."startsAt",
          o."endsAt") NOT IN (
       SELECT w.item_id, COALESCE(w.allocation_id, ''), w.kind, w.hold, w.starts_at, w.ends_at
         FROM line_occupancy_wanted(target_line_id) w);
  FOR wanted IN SELECT * FROM line_occupancy_wanted(target_line_id) LOOP
    PERFORM sync_line_occupancy_row(target_line_id, wanted.item_id, wanted.allocation_id,
      wanted.kind, wanted.hold, wanted.starts_at, wanted.ends_at);
  END LOOP;
EXCEPTION WHEN exclusion_violation THEN
  RAISE EXCEPTION USING ERRCODE = 'exclusion_violation', MESSAGE = 'line_occupancy_conflict',
    DETAIL = target_line_id;
END $$;

-- Re-derives a set of lines and collects every line that collides, so a configuration change
-- (state flags, changeover time, buffer minutes, capabilities, `closes` flag) is refused with all
-- of them listed.
CREATE OR REPLACE FUNCTION sync_line_occupancies(line_ids text[])
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  line_id text;
  conflicts text[] := '{}';
BEGIN
  FOREACH line_id IN ARRAY COALESCE(line_ids, '{}') LOOP
    BEGIN
      PERFORM sync_line_occupancy(line_id);
    EXCEPTION WHEN exclusion_violation THEN
      conflicts := conflicts || line_id;
    END;
  END LOOP;
  IF cardinality(conflicts) > 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'exclusion_violation', MESSAGE = 'line_occupancy_conflict',
      DETAIL = array_to_string(conflicts, ',');
  END IF;
END $$;

-- Only lines that have not ended are re-derived by configuration changes (ADR 0053, rule 8):
-- the past calendar is frozen. Untimed lines hold nothing and are included so they stay empty.
CREATE OR REPLACE FUNCTION line_not_ended(ends_at timestamp(3))
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT ends_at IS NULL OR ends_at > (now() AT TIME ZONE 'UTC')
$$;

CREATE OR REPLACE FUNCTION line_occupancy_on_line() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancy(NEW."id");
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_item_state() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."stateId" = NEW."id" AND l."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_setup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."setupId" = NEW."id" AND l."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_entity_type() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."organizationId" = NEW."organizationId" AND line_not_ended(l."endsAt")
       AND (EXISTS (SELECT 1 FROM "Item" i
                     WHERE i."id" = l."itemId" AND i."organizationId" = l."organizationId"
                       AND i."entityTypeId" = NEW."id")
         OR EXISTS (SELECT 1 FROM "LineAllocation" a
                      JOIN "Item" u ON u."id" = a."unitId"
                        AND u."organizationId" = a."organizationId"
                     WHERE a."lineId" = l."id" AND a."organizationId" = l."organizationId"
                       AND a."status" = 'ACTIVE' AND u."entityTypeId" = NEW."id"))
     ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_item() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."itemId" = NEW."id" AND l."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
     WHERE l."orderId" = NEW."id" AND l."organizationId" = NEW."organizationId"
     ORDER BY l."id"));
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION line_occupancy_on_order_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT l."id" FROM "Line" l
      JOIN "Order" t ON t."id" = l."orderId" AND t."organizationId" = l."organizationId"
     WHERE t."statusId" = NEW."id" AND t."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

-- A line's allocation filled, changed or removed: the line's holds follow.
CREATE OR REPLACE FUNCTION line_occupancy_on_allocation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY[NEW."lineId"]);
  RETURN NULL;
END $$;

-- A demand's windows changed or it was archived: the lines with its allocations that have not
-- ended follow.
CREATE OR REPLACE FUNCTION line_occupancy_on_item_demand() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_line_occupancies(ARRAY(
    SELECT DISTINCT l."id" FROM "Line" l
      JOIN "LineAllocation" a ON a."lineId" = l."id" AND a."organizationId" = l."organizationId"
     WHERE a."demandId" = NEW."id" AND a."organizationId" = NEW."organizationId"
       AND line_not_ended(l."endsAt") ORDER BY l."id"));
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS line_occupancy_insert ON "Line";
CREATE TRIGGER line_occupancy_insert AFTER INSERT ON "Line"
  FOR EACH ROW EXECUTE FUNCTION line_occupancy_on_line();

DROP TRIGGER IF EXISTS line_occupancy_update ON "Line";
CREATE TRIGGER line_occupancy_update AFTER UPDATE ON "Line"
  FOR EACH ROW WHEN (
    (OLD."itemId", OLD."setupId", OLD."setupMinutes", OLD."teardownMinutes", OLD."startsAt",
     OLD."endsAt", OLD."stateId", OLD."orderId", OLD."status")
    IS DISTINCT FROM
    (NEW."itemId", NEW."setupId", NEW."setupMinutes", NEW."teardownMinutes", NEW."startsAt",
     NEW."endsAt", NEW."stateId", NEW."orderId", NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_line();

DROP TRIGGER IF EXISTS line_occupancy_item_state ON "ItemState";
CREATE TRIGGER line_occupancy_item_state AFTER UPDATE ON "ItemState"
  FOR EACH ROW WHEN ((OLD."hold", OLD."released") IS DISTINCT FROM (NEW."hold", NEW."released"))
  EXECUTE FUNCTION line_occupancy_on_item_state();

DROP TRIGGER IF EXISTS line_occupancy_setup ON "Setup";
CREATE TRIGGER line_occupancy_setup AFTER UPDATE ON "Setup"
  FOR EACH ROW WHEN (OLD."changeoverMinutes" IS DISTINCT FROM NEW."changeoverMinutes")
  EXECUTE FUNCTION line_occupancy_on_setup();

DROP TRIGGER IF EXISTS line_occupancy_entity_type ON "EntityType";
CREATE TRIGGER line_occupancy_entity_type AFTER UPDATE ON "EntityType"
  FOR EACH ROW WHEN (
    (OLD."capabilities", OLD."setupMinutes", OLD."teardownMinutes")
    IS DISTINCT FROM (NEW."capabilities", NEW."setupMinutes", NEW."teardownMinutes"))
  EXECUTE FUNCTION line_occupancy_on_entity_type();

DROP TRIGGER IF EXISTS line_occupancy_item ON "Item";
CREATE TRIGGER line_occupancy_item AFTER UPDATE ON "Item"
  FOR EACH ROW WHEN (
    (OLD."setupMinutes", OLD."teardownMinutes")
    IS DISTINCT FROM (NEW."setupMinutes", NEW."teardownMinutes"))
  EXECUTE FUNCTION line_occupancy_on_item();

DROP TRIGGER IF EXISTS line_occupancy_order ON "Order";
CREATE TRIGGER line_occupancy_order AFTER UPDATE ON "Order"
  FOR EACH ROW WHEN ((OLD."statusId", OLD."status") IS DISTINCT FROM (NEW."statusId", NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_order();

DROP TRIGGER IF EXISTS line_occupancy_order_status ON "OrderStatus";
CREATE TRIGGER line_occupancy_order_status AFTER UPDATE ON "OrderStatus"
  FOR EACH ROW WHEN (OLD."closes" IS DISTINCT FROM NEW."closes")
  EXECUTE FUNCTION line_occupancy_on_order_status();

DROP TRIGGER IF EXISTS line_occupancy_allocation_insert ON "LineAllocation";
CREATE TRIGGER line_occupancy_allocation_insert AFTER INSERT ON "LineAllocation"
  FOR EACH ROW WHEN (NEW."unitId" IS NOT NULL)
  EXECUTE FUNCTION line_occupancy_on_allocation();

DROP TRIGGER IF EXISTS line_occupancy_allocation_update ON "LineAllocation";
CREATE TRIGGER line_occupancy_allocation_update AFTER UPDATE ON "LineAllocation"
  FOR EACH ROW WHEN ((OLD."unitId", OLD."status", OLD."lineId", OLD."demandId")
    IS DISTINCT FROM (NEW."unitId", NEW."status", NEW."lineId", NEW."demandId"))
  EXECUTE FUNCTION line_occupancy_on_allocation();

DROP TRIGGER IF EXISTS line_occupancy_item_demand ON "ItemDemand";
CREATE TRIGGER line_occupancy_item_demand AFTER UPDATE ON "ItemDemand"
  FOR EACH ROW WHEN ((OLD."windows", OLD."status") IS DISTINCT FROM (NEW."windows", NEW."status"))
  EXECUTE FUNCTION line_occupancy_on_item_demand();
-- END packages/db/sql/sync_line_occupancy.sql

-- BEGIN packages/db/sql/notify_inbox.sql
-- Push signal (ADR 0085, 0094): tells listeners (the web app's stream) that an organization's
-- inbox changed: a message came in, got a order, was read or unread, or was deleted. The payload
-- carries the organization only; listeners re-read the open count. `arrivedId` is a new inbox
-- message's id (inserted without a order; the browser toasts it), else null.
CREATE OR REPLACE FUNCTION notify_inbox() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'inbox',
    json_build_object(
      'organizationId', NEW."organizationId",
      'arrivedId', CASE WHEN TG_OP = 'INSERT' AND NEW."orderId" IS NULL THEN NEW."id" END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inbound_message_notify ON "InboundMessage";
CREATE TRIGGER inbound_message_notify
  AFTER INSERT OR UPDATE OF "orderId", "readAt", "status" ON "InboundMessage"
  FOR EACH ROW EXECUTE FUNCTION notify_inbox();
-- END packages/db/sql/notify_inbox.sql
