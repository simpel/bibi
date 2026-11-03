/**
 * Org-scoped models that are neither soft-deleted nor append-only, so hard deletion is permitted:
 * replacement sets owned by a parent and audited on it (ItemSetup, ItemPart, ItemCustomisationGroup,
 * ItemCustomisationOption, ItemDemandTag, BoardPhaseStatus, HoursDay, HoursException, MemberProfileItem, TicketStatusTransition, TicketStatusGate, ItemStateTransition, TicketTemplateLine,
 * TicketTemplateLineOption, PriceListItem, RevenueAccount (ADR 0077), OrderLine, InvoiceDeposit (ADR 0090), the id lists of responsibilities and work order
 * definitions and
 * RecordLink, ADR 0056), status grid cells (StatusStateRule, audited on itself), the derived
 * search index (Embedding), Better Auth membership rows (Member; Invitation has its own
 * `status`; core audits both), rows with their
 * own `status` lifecycle that are never removed (PaymentAccount, IntegrationConnection, Payment, Deposit, Invoice, ADR
 * 0057; InboundMessage, ADR 0085: `dismissedAt`), work order versions (`sentAt` is their lifecycle), followers (AssignmentFollower, removed on
 * unfollow), notifications (`readAt` is their lifecycle; preferences are upserted, ADR 0094) and credentials (Apikey: `enabled`; OauthGrantRevocation: one row per user and client).
 */
export const HARD_DELETE_MODELS = new Set<string>([
  "ItemSetup",
  "ItemPart",
  "ItemCustomisationGroup",
  "ItemCustomisationOption",
  "ItemDemandTag",
  "MemberProfileItem",
  "TicketStatusTransition",
  "TicketStatusGate",
  "BoardPhaseStatus",
  "ItemStateTransition",
  "StatusStateRule",
  "TicketTemplateLine",
  "TicketTemplateLineOption",
  "PriceListItem",
  "OrderLine",
  "InvoiceDeposit",
  "Embedding",
  "Member",
  "Invitation",
  "PaymentAccount",
  "IntegrationConnection",
  "Payment",
  "Deposit",
  "Invoice",
  "WorkOrder",
  "AssignmentFollower",
  "Notification",
  "NotificationPreference",
  "Apikey",
  "OauthGrantRevocation",
  "RevenueAccount",
  "InboundMessage",
  "ResponsibilityEntityType",
  "ResponsibilityDefaultFollower",
  "WorkOrderDefinitionEntityType",
  "WorkOrderDefinitionField",
  "WorkOrderDefinitionVocabulary",
  "RecordLink",
  "HoursDay",
  "HoursException",
]);
