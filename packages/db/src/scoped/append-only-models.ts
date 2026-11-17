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

/**
 * Projections written only by database triggers (ADR 0053, 0113): `scopedDb` reads them and
 * refuses every write, so application code cannot drift from the trigger's derivation.
 */
export const TRIGGER_ONLY_MODELS = new Set<string>(["RecordRelation"]);

/** Append-only models: no update/delete/upsert through `scopedDb`. */
export const APPEND_ONLY_MODELS = new Set<string>([
  "AuditLog",
  "Message",
  "InboundEmail",
  "RunSheetRecipient",
  "KnownMember",
  ...DOMAIN_HISTORY_MODELS,
]);
