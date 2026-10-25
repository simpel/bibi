/**
 * Org-scoped models that are neither soft-deleted nor append-only, so hard deletion is permitted:
 * replacement sets owned by a parent and audited on it (ItemSetup, ItemPart, ItemCustomisationGroup,
 * ItemCustomisationOption, ItemDemandTag, HoursDay, HoursException, MemberProfileItem, TicketStatusTransition, ItemStateTransition, TicketTemplateLine,
 * PriceListItem, OrderLine, the id lists of responsibilities and sheet definitions and
 * RecordLink, ADR 0056), status grid cells (StatusStateRule, audited on itself), the derived
 * search index (Embedding), Better Auth membership rows (Member; Invitation has its own
 * `status`; core audits both), rows with their
 * own `status` lifecycle that are never removed (PaymentAccount, Payment, Deposit, Invoice, ADR
 * 0057), sheet versions (`sentAt` is their lifecycle), followers (AssignmentFollower, removed on
 * unfollow) and credentials (Apikey: `enabled`; OauthGrantRevocation: one row per user and client).
 */
export const HARD_DELETE_MODELS = new Set<string>([
  "ItemSetup",
  "ItemPart",
  "ItemCustomisationGroup",
  "ItemCustomisationOption",
  "ItemDemandTag",
  "MemberProfileItem",
  "TicketStatusTransition",
  "ItemStateTransition",
  "StatusStateRule",
  "TicketTemplateLine",
  "PriceListItem",
  "OrderLine",
  "Embedding",
  "Member",
  "Invitation",
  "PaymentAccount",
  "Payment",
  "Deposit",
  "Invoice",
  "Sheet",
  "AssignmentFollower",
  "Apikey",
  "OauthGrantRevocation",
  "ResponsibilityEntityType",
  "ResponsibilityDefaultFollower",
  "SheetDefinitionEntityType",
  "SheetDefinitionField",
  "SheetDefinitionVocabulary",
  "RecordLink",
  "HoursDay",
  "HoursException",
]);
