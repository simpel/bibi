/** The providers Bibi knows (ADR 0100); one Prisma enum `Provider`. */
export const PROVIDER_KEYS = ["STRIPE", "FORTNOX", "SWISH", "VISMA"] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

/** How a customer pays (ADR 0100). MANUAL is staff recording money no provider took. */
export const PAYMENT_METHODS = ["CARD", "SWISH", "INVOICE", "MANUAL"] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];
