/**
 * ADR 0006 conventions for org-scoped models and their listed exceptions. Global and platform
 * tables (`UNSCOPED_MODELS`) follow their owners (Better Auth, ADR 0015) and are exempt as a whole.
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
  // Derived search index, rebuilt from its entity; not authored by anyone.
  ["Embedding", ["createdBy"]],
  // Better Auth tables (shape owned by Better Auth); `inviterId` records the inviter.
  ["Member", ["updatedAt", "createdBy"]],
  ["Invitation", ["updatedAt", "createdBy"]],
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
  "Responsibility",
  "Item",
  "ItemSetup",
  "ItemComponent",
  "ItemChoiceGroup",
  "Customer",
  "Contact",
  "PriceList",
  "PriceListItem",
  "Occupancy",
  "Option",
  "BookingStatus",
  "BookingStatusTransition",
  "Booking",
  "BookingSeries",
  "ProgramItem",
  "Requirement",
  "Sheet",
  "Inquiry",
  "Quote",
  "OrderLine",
  "InboundEmail",
  "PaymentAccount",
  "Payment",
  "Conversation",
  "Message",
  "Skill",
]);

/**
 * Org-scoped models whose id has no `@default(cuid(2))`: the writer passes `createId()` (core for
 * Better Auth tables, raw SQL for Embedding). Rows Better Auth writes itself use its own format.
 */
export const APP_ID_MODELS = new Set<string>(["Member", "Invitation", "Embedding"]);

/**
 * Org-scoped models that are neither soft-deleted nor append-only, so hard deletion is permitted:
 * replacement sets owned by a parent (ItemSetup, ItemComponent, ItemChoiceGroup; audited on the
 * item; BookingStatusTransition, audited on its from-status; PriceListItem, audited on its price
 * list; OrderLine, audited on its quote), the derived
 * search index (Embedding) and Better Auth membership rows (Member is deleted on removal,
 * Invitation has its own `status` lifecycle; core audits both) and the payout account
 * (PaymentAccount: one row per organization with its own `status` lifecycle, never removed) and
 * payments (Payment: its own `status` lifecycle, never removed) and sheet versions (Sheet:
 * history, `sentAt` is its lifecycle, never removed).
 */
export const HARD_DELETE_MODELS = new Set<string>([
  "ItemSetup",
  "ItemComponent",
  "ItemChoiceGroup",
  "BookingStatusTransition",
  "PriceListItem",
  "OrderLine",
  "Embedding",
  "Member",
  "Invitation",
  "PaymentAccount",
  "Payment",
  "Sheet",
]);
