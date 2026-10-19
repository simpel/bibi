/**
 * Approval label keys of payments and the receivables they settle (ADR 0057), kept apart so
 * `approval-labels.ts` stays within the size limit.
 */
export const MONEY_FIELD_KEYS = [
  "amountMinor",
  "dueDate",
  "method",
  "quoteId",
  "depositId",
  "invoiceId",
] as const;

/** Money operations with a localized label in `assistant.approval.operations`. */
export const MONEY_OPERATION_KEYS = [
  "deposit_create",
  "deposit_send",
  "deposit_void",
  "invoice_create",
  "invoice_send",
  "invoice_void",
  "payment_create",
] as const;
