import { getEnv } from "@bibi/config";
import type { ProviderAdapter } from "../types";
import { stripeCollect } from "./stripe-collect";
import { stripeConnect } from "./stripe-connect";
import { stripeWebhook } from "./stripe-webhook";

/**
 * Stripe (ADR 0028, 0100): hosted onboarding of a Connect account, card checkouts (and, until
 * invoices move to the invoicing port, one-line Stripe invoices) and webhook signals. Stripe keeps
 * no books for the venue.
 */
export const stripeAdapter: ProviderAdapter = {
  key: "STRIPE",
  ledger: false,
  isConfigured: () => {
    const { STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID } = getEnv();
    return Boolean(STRIPE_SECRET_KEY && STRIPE_PLATFORM_ACCOUNT_ID);
  },
  connect: stripeConnect,
  collect: stripeCollect,
  signals: { webhook: stripeWebhook },
};
