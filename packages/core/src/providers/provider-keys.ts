/** The providers Bibi knows (ADR 0100); one Prisma enum `Provider`. */
export const PROVIDER_KEYS = ["STRIPE", "FORTNOX", "SWISH", "VISMA"] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

/** How a customer pays (ADR 0100). MANUAL is staff recording money no provider took. */
export const PAYMENT_METHODS = ["CARD", "SWISH", "INVOICE", "MANUAL"] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

/**
 * What can be wrong between Bibi's mappings and the accounting system's accounts (ADR 0108,
 * 0123), derived on read: a mapped account the system no longer has (or inactive), no coding at
 * a VAT rate in use for a mapped Spiris family or for the deposits purpose, or the accounts
 * could not be read (a Fortnox token without the bookkeeping scope: reconnect).
 */
export const SETUP_ISSUE_CODES = [
  "ACCOUNT_MISSING",
  "ADVANCES_CODING_MISSING",
  "REVENUE_CODING_MISSING",
  "ACCOUNTS_UNAVAILABLE",
] as const;
export type SetupIssueCode = (typeof SETUP_ISSUE_CODES)[number];
