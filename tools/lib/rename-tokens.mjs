// Token transformation utilities for Phase 1 (WorkOrder -> RunSheet) and Phase 2 (Ticket -> Order).

export function replacePairs({ text, pairs }) {
  let count = 0;
  let output = text;
  for (const { pattern, replacement } of pairs) {
    const matches = output.match(pattern);
    if (matches) {
      count += matches.length;
      output = output.replace(pattern, replacement);
    }
  }
  return { output, count, changed: output !== text };
}

/**
 * Phase 1: WorkOrder -> RunSheet (English code & strings)
 * Ordered strictly from most specific to least specific.
 */
export const WORK_ORDER_PAIRS = [
  // 1. Definition join tables
  { pattern: /WorkOrderDefinitionEntityType/g, replacement: "RunSheetDefinitionEntityType" },
  { pattern: /workOrderDefinitionEntityType/g, replacement: "runSheetDefinitionEntityType" },
  {
    pattern: /work-order-definition-entity-type/g,
    replacement: "run-sheet-definition-entity-type",
  },
  {
    pattern: /work_order_definition_entity_type/g,
    replacement: "run_sheet_definition_entity_type",
  },

  { pattern: /WorkOrderDefinitionField/g, replacement: "RunSheetDefinitionField" },
  { pattern: /workOrderDefinitionField/g, replacement: "runSheetDefinitionField" },
  { pattern: /work-order-definition-field/g, replacement: "run-sheet-definition-field" },
  { pattern: /work_order_definition_field/g, replacement: "run_sheet_definition_field" },

  { pattern: /WorkOrderDefinitionVocabulary/g, replacement: "RunSheetDefinitionVocabulary" },
  { pattern: /workOrderDefinitionVocabulary/g, replacement: "runSheetDefinitionVocabulary" },
  { pattern: /work-order-definition-vocabulary/g, replacement: "run-sheet-definition-vocabulary" },
  { pattern: /work_order_definition_vocabulary/g, replacement: "run_sheet_definition_vocabulary" },

  // 2. Base WorkOrderDefinition
  { pattern: /WorkOrderDefinitions/g, replacement: "RunSheetDefinitions" },
  { pattern: /workOrderDefinitions/g, replacement: "runSheetDefinitions" },
  { pattern: /work-order-definitions/g, replacement: "run-sheet-definitions" },
  { pattern: /work_order_definitions/g, replacement: "run_sheet_definitions" },
  { pattern: /WORK_ORDER_DEFINITIONS/g, replacement: "RUN_SHEET_DEFINITIONS" },

  { pattern: /WorkOrderDefinition/g, replacement: "RunSheetDefinition" },
  { pattern: /workOrderDefinition/g, replacement: "runSheetDefinition" },
  { pattern: /work-order-definition/g, replacement: "run-sheet-definition" },
  { pattern: /work_order_definition/g, replacement: "run_sheet_definition" },
  { pattern: /WORK_ORDER_DEFINITION/g, replacement: "RUN_SHEET_DEFINITION" },

  // 3. Recipient
  { pattern: /WorkOrderRecipientRole/g, replacement: "RunSheetRecipientRole" },
  { pattern: /workOrderRecipientRole/g, replacement: "runSheetRecipientRole" },
  { pattern: /WorkOrderRecipients/g, replacement: "RunSheetRecipients" },
  { pattern: /workOrderRecipients/g, replacement: "runSheetRecipients" },
  { pattern: /WorkOrderRecipient/g, replacement: "RunSheetRecipient" },
  { pattern: /workOrderRecipient/g, replacement: "runSheetRecipient" },
  { pattern: /work-order-recipient/g, replacement: "run-sheet-recipient" },
  { pattern: /work_order_recipient/g, replacement: "run_sheet_recipient" },

  // 4. Status, Match, Change
  { pattern: /WorkOrderStatus/g, replacement: "RunSheetStatus" },
  { pattern: /workOrderStatus/g, replacement: "runSheetStatus" },
  { pattern: /WorkOrderMatch/g, replacement: "RunSheetMatch" },
  { pattern: /workOrderMatch/g, replacement: "runSheetMatch" },
  { pattern: /WorkOrderChange/g, replacement: "RunSheetChange" },
  { pattern: /workOrderChange/g, replacement: "runSheetChange" },

  // 5. Flags
  { pattern: /inWorkOrders/g, replacement: "inRunSheets" },
  { pattern: /in_work_orders/g, replacement: "in_run_sheets" },
  { pattern: /in-work-orders/g, replacement: "in-run-sheets" },

  // 6. Plural WorkOrders
  { pattern: /WorkOrders/g, replacement: "RunSheets" },
  { pattern: /workOrders/g, replacement: "runSheets" },
  { pattern: /work-orders/g, replacement: "run-sheets" },
  { pattern: /work_orders/g, replacement: "run_sheets" },
  { pattern: /WORK_ORDERS/g, replacement: "RUN_SHEETS" },

  // 7. Base WorkOrder (covers workOrderId, openWorkOrder, etc.)
  { pattern: /WorkOrder/g, replacement: "RunSheet" },
  { pattern: /workOrder/g, replacement: "runSheet" },
  { pattern: /work-order/g, replacement: "run-sheet" },
  { pattern: /work_order/g, replacement: "run_sheet" },
  { pattern: /WORK_ORDER/g, replacement: "RUN_SHEET" },

  // 8. Plain English text (word boundaries)
  { pattern: /\bWork orders\b/g, replacement: "Run sheets" },
  { pattern: /\bWork Orders\b/g, replacement: "Run Sheets" },
  { pattern: /\bwork orders\b/g, replacement: "run sheets" },
  { pattern: /\bWork order\b/g, replacement: "Run sheet" },
  { pattern: /\bWork Order\b/g, replacement: "Run Sheet" },
  { pattern: /\bwork order\b/g, replacement: "run sheet" },
  { pattern: /\ba work order\b/g, replacement: "a run sheet" },
  { pattern: /\bA work order\b/g, replacement: "A run sheet" },
];

/**
 * Phase 2: Ticket -> Order (English code & strings)
 * Ordered strictly from most specific to least specific.
 */
export const TICKET_PAIRS = [
  // Status transitions & gates
  { pattern: /TicketStatusTransition/g, replacement: "OrderStatusTransition" },
  { pattern: /ticketStatusTransition/g, replacement: "orderStatusTransition" },
  { pattern: /TicketStatusGate/g, replacement: "OrderStatusGate" },
  { pattern: /ticketStatusGate/g, replacement: "orderStatusGate" },
  { pattern: /TicketStatusChange/g, replacement: "OrderStatusChange" },
  { pattern: /ticketStatusChange/g, replacement: "orderStatusChange" },
  { pattern: /TicketStatusHistoryWireSchema/g, replacement: "OrderStatusHistoryWireSchema" },
  { pattern: /TicketStatusHistoryWire/g, replacement: "OrderStatusHistoryWire" },
  { pattern: /TicketStatusHistoryOutput/g, replacement: "OrderStatusHistoryOutput" },
  { pattern: /TicketStatusHistory/g, replacement: "OrderStatusHistory" },
  { pattern: /ticketStatusHistory/g, replacement: "orderStatusHistory" },
  { pattern: /TicketStatusWire/g, replacement: "OrderStatusWire" },
  { pattern: /TicketStatusSchema/g, replacement: "OrderStatusSchema" },
  { pattern: /TicketStatusImportWire/g, replacement: "OrderStatusImportWire" },

  // Base TicketStatus
  { pattern: /TicketStatuses/g, replacement: "OrderStatuses" },
  { pattern: /ticketStatuses/g, replacement: "orderStatuses" },
  { pattern: /ticket-statuses/g, replacement: "order-statuses" },
  { pattern: /ticket_statuses/g, replacement: "order_statuses" },
  { pattern: /TICKET_STATUSES/g, replacement: "ORDER_STATUSES" },

  { pattern: /TicketStatus/g, replacement: "OrderStatus" },
  { pattern: /ticketStatus/g, replacement: "orderStatus" },
  { pattern: /ticket-status/g, replacement: "order-status" },
  { pattern: /ticket_status/g, replacement: "order_status" },
  { pattern: /TICKET_STATUS/g, replacement: "ORDER_STATUS" },

  // Template line options & lines
  { pattern: /TicketTemplateLineOption/g, replacement: "OrderTemplateLineOption" },
  { pattern: /ticketTemplateLineOption/g, replacement: "orderTemplateLineOption" },
  { pattern: /TicketTemplateLine/g, replacement: "OrderTemplateLine" },
  { pattern: /ticketTemplateLine/g, replacement: "orderTemplateLine" },
  { pattern: /TicketTemplateWire/g, replacement: "OrderTemplateWire" },
  { pattern: /TicketTemplateSchema/g, replacement: "OrderTemplateSchema" },

  // Base TicketTemplate
  { pattern: /TicketTemplates/g, replacement: "OrderTemplates" },
  { pattern: /ticketTemplates/g, replacement: "orderTemplates" },
  { pattern: /ticket-templates/g, replacement: "order-templates" },
  { pattern: /ticket_templates/g, replacement: "order_templates" },
  { pattern: /TICKET_TEMPLATES/g, replacement: "ORDER_TEMPLATES" },

  { pattern: /TicketTemplate/g, replacement: "OrderTemplate" },
  { pattern: /ticketTemplate/g, replacement: "orderTemplate" },
  { pattern: /ticket-template/g, replacement: "order-template" },
  { pattern: /ticket_template/g, replacement: "order_template" },
  { pattern: /TICKET_TEMPLATE/g, replacement: "ORDER_TEMPLATE" },

  // Draft
  { pattern: /TicketDrafts/g, replacement: "OrderDrafts" },
  { pattern: /ticketDrafts/g, replacement: "orderDrafts" },
  { pattern: /TicketDraft/g, replacement: "OrderDraft" },
  { pattern: /ticketDraft/g, replacement: "orderDraft" },
  { pattern: /ticket-draft/g, replacement: "order-draft" },
  { pattern: /ticket_draft/g, replacement: "order_draft" },
  { pattern: /TICKET_DRAFT/g, replacement: "ORDER_DRAFT" },

  // Estimates
  { pattern: /TicketEstimateHistoryWire/g, replacement: "OrderEstimateHistoryWire" },
  { pattern: /TicketEstimateHistoryOutput/g, replacement: "OrderEstimateHistoryOutput" },
  { pattern: /TicketEstimateHistory/g, replacement: "OrderEstimateHistory" },
  { pattern: /ticketEstimateHistory/g, replacement: "orderEstimateHistory" },
  { pattern: /TicketEstimate/g, replacement: "OrderEstimate" },
  { pattern: /ticketEstimate/g, replacement: "orderEstimate" },
  { pattern: /TicketEstimates/g, replacement: "OrderEstimates" },
  { pattern: /ticketEstimates/g, replacement: "orderEstimates" },

  // Balances & Wires
  { pattern: /TicketBalanceWire/g, replacement: "OrderBalanceWire" },
  { pattern: /TicketBalanceSchema/g, replacement: "OrderBalanceSchema" },
  { pattern: /TicketBalance/g, replacement: "OrderBalance" },
  { pattern: /ticketBalance/g, replacement: "orderBalance" },
  { pattern: /TicketWireSchema/g, replacement: "OrderWireSchema" },
  { pattern: /TicketWire/g, replacement: "OrderWire" },
  { pattern: /ticketWire/g, replacement: "orderWire" },

  // Intake & Sheet UI & Wires
  { pattern: /ticketIntake/g, replacement: "orderIntake" },
  { pattern: /ticket-intake/g, replacement: "order-intake" },
  { pattern: /ticketSheet/g, replacement: "orderSheet" },
  { pattern: /ticket-sheet/g, replacement: "order-sheet" },

  // Catalog filename references
  { pattern: /messages\/en\/tickets\.json/g, replacement: "messages/en/orders.json" },
  { pattern: /messages\/sv\/tickets\.json/g, replacement: "messages/sv/orders.json" },
  { pattern: /ticketsEn/g, replacement: "ordersEn" },
  { pattern: /ticketsSv/g, replacement: "ordersSv" },

  // Compound camelCase starting with ticket (e.g. ticketId, ticketTitle, ticketRef)
  { pattern: /\bticket([A-Z0-9])/g, replacement: "order$1" },
  { pattern: /\bTicket([A-Z0-9])/g, replacement: "Order$1" },

  // Infix camelCase (e.g. deriveTicketLines, expireTicketHolds, expectedTicketCount)
  { pattern: /([a-z0-9])Tickets([A-Z0-9])/g, replacement: "$1Orders$2" },
  { pattern: /([a-z0-9])Ticket([A-Z0-9])/g, replacement: "$1Order$2" },

  // Suffix compound camelCase (e.g. archiveTickets, recentTickets, hasTickets, updateTicket)
  { pattern: /([a-z0-9])Tickets\b/g, replacement: "$1Orders" },
  { pattern: /([a-z0-9])Ticket\b/g, replacement: "$1Order" },

  // Plurals
  { pattern: /\bTickets\b/g, replacement: "Orders" },
  { pattern: /\btickets\b/g, replacement: "orders" },
  { pattern: /\bTICKETS\b/g, replacement: "ORDERS" },

  // Singulars
  { pattern: /\bTicket\b/g, replacement: "Order" },
  { pattern: /\bticket\b/g, replacement: "order" },
  { pattern: /\bTICKET\b/g, replacement: "ORDER" },

  // Compound / prefixed forms in kebab and snake
  { pattern: /\bticket-([a-z0-9])/g, replacement: "order-$1" },
  { pattern: /([a-z0-9])-ticket\b/g, replacement: "$1-order" },
  { pattern: /\bticket_([a-z0-9])/g, replacement: "order_$1" },
  { pattern: /([a-z0-9])_ticket\b/g, replacement: "$1_order" },

  // Plain English prose
  { pattern: /\ba ticket\b/g, replacement: "an order" },
  { pattern: /\bA ticket\b/g, replacement: "An order" },
  { pattern: /\bthe ticket\b/g, replacement: "the order" },
  { pattern: /\bThe ticket\b/g, replacement: "The order" },
  { pattern: /\bthis ticket\b/g, replacement: "this order" },
  { pattern: /\bThis ticket\b/g, replacement: "This order" },
];
