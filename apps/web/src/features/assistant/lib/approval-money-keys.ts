/**
 * Approval label keys of payments, the receivables they settle (ADR 0057) and the accounting
 * settings (ADR 0077), kept apart so
 * `approval-labels.ts` stays within the size limit.
 */
export const MONEY_FIELD_KEYS = [
  "amountMinor",
  "dueDate",
  "method",
  "quoteId",
  "depositId",
  "invoiceId",
  "receivableAccount",
  "clearingAccount",
  "advancesAccount",
  "feesAccount",
  "roundingAccount",
  "revenueAccount",
  "vat25Account",
  "vat12Account",
  "vat6Account",
  "fiscalYearStartMonth",
  "revenueAccounts",
  "estimatedValueMinor",
  "depositPercent",
  "depositMinimumMinor",
  "invoiceProvider",
  "paymentOperator",
  "autoAssignSeats",
  "extraSeats",
] as const;

/** Money operations with a localized label in `assistant.approval.operations`. */
export const MONEY_OPERATION_KEYS = [
  "deposit_create",
  "deposit_request",
  "deposit_send",
  "deposit_void",
  "invoice_create",
  "invoice_send",
  "invoice_sync",
  "invoice_void",
  "invoice_credit",
  "payment_create",
  "payment_refund",
  "payment_cancel",
  "payment_recordManual",
  "accountingSettings_update",
  "paymentSettings_update",
  "accountingExport_create",
  "billing_update",
  "billing_approveSeat",
  "billing_rejectSeat",
  "billing_remindAdmins",
] as const;
