/**
 * Domain history tables (ADR 0054): org-scoped and append-only. A row is inserted by core and
 * never changed; its trigger projects the current phase or state (`domain_history.sql`).
 */
export const DOMAIN_HISTORY_MODELS = ["TicketPhaseChange", "LineStateChange"] as const;

/** Append-only models: no update/delete/upsert through `scopedDb`. */
export const APPEND_ONLY_MODELS = new Set<string>([
  "AuditLog",
  "Message",
  "InboundEmail",
  ...DOMAIN_HISTORY_MODELS,
]);
