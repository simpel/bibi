/**
 * Domain history tables (ADR 0054, 0074): org-scoped and append-only. A row is inserted by core and
 * never changed; a trigger projects the current status or state (`domain_history.sql`), and the
 * newest estimate is read from its table.
 */
export const DOMAIN_HISTORY_MODELS = [
  "OrderStatusChange",
  "LineStateChange",
  "OrderEstimate",
] as const;

/** Append-only models: no update/delete/upsert through `scopedDb`. */
export const APPEND_ONLY_MODELS = new Set<string>([
  "AuditLog",
  "Message",
  "InboundEmail",
  "RunSheetRecipient",
  "KnownMember",
  "AccountingExportEntry",
  ...DOMAIN_HISTORY_MODELS,
]);
