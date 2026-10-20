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
  ["TicketPhaseChange", ["createdAt", "updatedAt", "createdBy"]],
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
  "Assignment",
  "AssignmentFollower",
  "Record",
  "RecordLink",
  "Item",
  "ItemSetup",
  "ItemComponent",
  "ItemChoiceGroup",
  "Customer",
  "Contact",
  "PriceList",
  "PriceListItem",
  "Occupancy",
  "TicketPhase",
  "TicketPhaseTransition",
  "ItemState",
  "ItemStateTransition",
  "PhaseStateRule",
  "Ticket",
  "TicketTemplate",
  "TicketTemplateLine",
  "Line",
  "AlternativeGroup",
  "Requirement",
  "Sheet",
  "Quote",
  "OrderLine",
  "InboundEmail",
  "PaymentAccount",
  "Payment",
  "Deposit",
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

/**
 * Org-scoped models that are neither soft-deleted nor append-only, so hard deletion is permitted:
 * replacement sets owned by a parent (ItemSetup, ItemComponent, ItemChoiceGroup; audited on the
 * item; TicketPhaseTransition, audited on its from-phase; ItemStateTransition, audited on its from-state; PhaseStateRule, a phase grid cell audited on itself; TicketTemplateLine, audited on its template; PriceListItem, audited on its price
 * list; OrderLine, audited on its quote), the derived
 * search index (Embedding) and Better Auth membership rows (Member is deleted on removal,
 * Invitation has its own `status` lifecycle; core audits both) and the payout account
 * (PaymentAccount: one row per organization with its own `status` lifecycle, never removed) and
 * payments and the receivables they settle (Payment, Deposit, Invoice: their own `status`
 * lifecycle, never removed, ADR 0057) and sheet versions (Sheet:
 * history, `sentAt` is its lifecycle, never removed), followers (AssignmentFollower: removed on
 * unfollow, audited on its assignment) and credentials (Apikey: `enabled` is its lifecycle,
 * revoked keys stay; OauthGrantRevocation: one row per user and client, updated on every revoke,
 * never removed) and the id lists of responsibilities and sheet definitions (ADR 0056: replacement
 * sets, audited on their parent) and LINK values (RecordLink, ADR 0056: a replacement set audited
 * on its record).
 */
export const HARD_DELETE_MODELS = new Set<string>([
  "ItemSetup",
  "ItemComponent",
  "ItemChoiceGroup",
  "TicketPhaseTransition",
  "ItemStateTransition",
  "PhaseStateRule",
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
]);
