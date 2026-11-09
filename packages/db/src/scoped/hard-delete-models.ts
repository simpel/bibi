/**
 * Org-scoped models that are neither soft-deleted nor append-only, so hard deletion is permitted:
 * replacement sets owned by a parent and audited on it (ItemSetup, FloorElement, ItemPart, ItemCustomisationGroup,
 * ItemCustomisationOption, ItemDemandTag, BoardPhaseStatus, HoursDay, HoursException, MemberProfileItem, OrderStatusTransition, OrderStatusGate, ItemStateTransition, OrderTemplateLine,
 * OrderTemplateLineOption, PriceListItem, RevenueAccount (ADR 0077), OrderLine, InvoiceDeposit (ADR 0090), the id lists of responsibilities and run sheet
 * definitions and
 * RecordLink, ADR 0056), status grid cells (StatusStateRule, audited on itself), the derived
 * search index (Embedding), Better Auth membership rows (Member; Invitation has its own
 * `status`; core audits both), rows with their
 * own `status` lifecycle that are never removed (ProviderConnection, Payment, PaymentAttempt, PaymentRefund,
 * Deposit, Invoice, CreditNote, ADR 0057, 0100), routes replaced by settings (PaymentMethodRoute), run sheet versions (`sentAt` is their lifecycle), followers (AssignmentFollower, removed on
 * unfollow), notifications (`readAt` is their lifecycle; preferences are upserted, ADR 0094) and credentials (Apikey: `enabled`; OauthGrantRevocation: one row per user and client).
 */
export const HARD_DELETE_MODELS = new Set<string>([
  "ItemSetup",
  "FloorElement",
  "ItemPart",
  "ItemCustomisationGroup",
  "ItemCustomisationOption",
  "ItemDemandTag",
  "MemberProfileItem",
  "OrderStatusTransition",
  "OrderStatusGate",
  "BoardPhaseStatus",
  "ItemStateTransition",
  "StatusStateRule",
  "OrderTemplateLine",
  "OrderTemplateLineOption",
  "PriceListItem",
  "OrderLine",
  "InvoiceDeposit",
  "Embedding",
  "Member",
  "Invitation",
  "ProviderConnection",
  "PaymentMethodRoute",
  "Payment",
  "PaymentAttempt",
  "PaymentRefund",
  "Deposit",
  "Invoice",
  "CreditNote",
  "RunSheet",
  "AssignmentFollower",
  "Notification",
  "NotificationPreference",
  "Apikey",
  "OauthGrantRevocation",
  "RevenueAccount",
  "ResponsibilityEntityType",
  "ResponsibilityDefaultFollower",
  "RunSheetDefinitionEntityType",
  "RunSheetDefinitionField",
  "RunSheetDefinitionVocabulary",
  "RecordLink",
  "HoursDay",
  "HoursException",
]);
