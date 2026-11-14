/** The providers Bibi knows (ADR 0100); one Prisma enum `Provider`. */
export const PROVIDER_KEYS = ["STRIPE", "FORTNOX", "SWISH", "VISMA"] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

/** How a customer pays (ADR 0100). MANUAL is staff recording money no provider took. */
export const PAYMENT_METHODS = ["CARD", "SWISH", "INVOICE", "MANUAL"] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

/**
 * What a setup check at an accounting system can find (ADR 0108): an account Bibi books to that
 * the system lacks, no account coding at a VAT rate that books to the advances account or to
 * revenue, or a mapped revenue account no coding books to (the system's default is used then).
 */
export const SETUP_ISSUE_CODES = [
  "ACCOUNT_MISSING",
  "ADVANCES_CODING_MISSING",
  "REVENUE_CODING_MISSING",
  "ACCOUNT_NOT_CODED",
] as const;
export type SetupIssueCode = (typeof SETUP_ISSUE_CODES)[number];
