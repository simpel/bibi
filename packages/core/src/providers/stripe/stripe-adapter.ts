import { getEnv } from "@bibi/config";
import type { ProviderAdapter } from "../types";
import { stripeCollect } from "./stripe-collect";
import { stripeConnect } from "./stripe-connect";
import { stripeWebhook } from "./stripe-webhook";

/**
 * Stripe (ADR 0028, 0100, 0106): hosted onboarding of a Connect account, card checkouts and
 * webhook signals. Stripe keeps no books and raises no invoices: the accounting system does.
 */
export const stripeAdapter: ProviderAdapter = {
  key: "STRIPE",
  ledger: false,
  isConfigured: () => {
    const { STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID, STRIPE_API_BASE_URL } = getEnv();
    return Boolean(STRIPE_SECRET_KEY && STRIPE_PLATFORM_ACCOUNT_ID && STRIPE_API_BASE_URL);
  },
  connect: stripeConnect,
  collect: stripeCollect,
  signals: { webhook: stripeWebhook },
};
