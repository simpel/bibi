/**
 * ADR 0006 conventions for org-scoped models and their listed exceptions. Global and platform
 * tables (`UNSCOPED_MODELS`) follow their owners (Better Auth, ADR 0015) and are exempt as a whole;
 * user-scoped tables (`USER_SCOPED_MODELS`, ADR 0039) are checked in `test/user-scope.test.ts`.
 * `packages/db/test/conventions.test.ts` checks every Prisma model against these lists.
 */

/** Columns every org-scoped table has unless `COLUMN_EXCEPTIONS` says otherwise. */
export const CONVENTION_COLUMNS = ["createdAt", "updatedAt", "createdBy"] as const;

export type ConventionColumn = (typeof CONVENTION_COLUMNS)[number];

/** Org-scoped models that lack convention columns, and why. */
export const COLUMN_EXCEPTIONS: ReadonlyMap<string, readonly ConventionColumn[]> = new Map([
  // Append-only: rows never change; `actorId` is who acted.
  ["AuditLog", ["updatedAt", "createdBy"]],
  // Append-only: rows never change; `createdBy` is set.
  ["Message", ["updatedAt"]],
  // Append-only: a received mail never changes; written by the inbound webhook (SYSTEM).
  ["InboundEmail", ["updatedAt"]],
  // Append-only domain history (ADR 0054): `changedAt` and `changedBy` say when and who.
  ["TicketStatusChange", ["createdAt", "updatedAt", "createdBy"]],
  ["LineStateChange", ["createdAt", "updatedAt", "createdBy"]],
  // Derived search index, rebuilt from its entity; not authored by anyone.
  ["Embedding", ["createdBy"]],
  // Better Auth tables (shape owned by Better Auth); `inviterId` records the inviter.
  ["Member", ["updatedAt", "createdBy"]],
  ["Invitation", ["updatedAt", "createdBy"]],
  // Better Auth's API key table; the owning member is `metadata.userId` (core `apiKey.create`).
  ["Apikey", ["createdBy"]],
]);

/** Org-scoped models with a `createdBy` column: `scopedDb` sets it on every create. */
export const CREATED_BY_MODELS = new Set<string>([
  "Venue",
  "EntityType",
  "FieldDefinition",
  "Vocabulary",
  "VocabularyValue",
  "Setup",
  "SheetDefinition",
  "SheetDefinitionEntityType",
  "SheetDefinitionField",
  "SheetDefinitionVocabulary",
  "Responsibility",
  "ResponsibilityEntityType",
  "ResponsibilityDefaultFollower",
  "PermissionOverride",
  "Assignment",
  "AssignmentFollower",
  "Record",
  "RecordLink",
  "Item",
  "ItemSetup",
  "ItemPart",
  "ItemCustomisationGroup",
  "ItemCustomisationOption",
  "ItemDemand",
  "ItemDemandTag",
  "Customer",
  "Contact",
  "PriceList",
  "PriceListItem",
  "Occupancy",
  "TicketStatus",
  "TicketStatusTransition",
  "ItemState",
  "ItemStateTransition",
  "StatusStateRule",
  "Ticket",
  "TicketTemplate",
  "TicketTemplateLine",
  "Line",
  "LineAllocation",
  "AlternativeGroup",
  "Requirement",
  "Sheet",
  "SheetRecipient",
  "Quote",
  "OrderLine",
  "InboundEmail",
  "PaymentAccount",
  "Payment",
  "Deposit",
  "OrganizationProfile",
  "Invoice",
  "Conversation",
  "Message",
  "Skill",
  "OauthGrantRevocation",
]);

/**
 * Org-scoped models whose id has no `@default(cuid(2))`: the writer passes `createId()` (core for
 * Better Auth tables, raw SQL for Embedding). Rows Better Auth writes itself use its own format.
 * The tables extending `Record` (ADR 0056) take the cuid2 id of their supertable row.
 */
export const APP_ID_MODELS = new Set<string>([
  "Member",
  "Invitation",
  "Apikey",
  "Embedding",
  "Item",
  "Customer",
  "Contact",
  "Ticket",
  "TicketTemplate",
  "Line",
  "Requirement",
]);
