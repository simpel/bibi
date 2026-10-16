/**
 * Sales pipeline operations (ADR 0022): options and quotes, kept apart so `operation-names.ts`
 * stays within the size limit.
 */
export const SALES_NAMES = [
  "option.create",
  "option.expireDue",
  "option.get",
  "option.list",
  "option.release",
  "quote.create",
  "quote.decline",
  "quote.expire",
  "quote.get",
  "quote.list",
  "quote.revise",
  "quote.send",
  "quote.update",
];
