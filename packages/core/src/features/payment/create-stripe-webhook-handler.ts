import type { Db } from "@bibi/db";
import { createProviderWebhookHandler } from "../../providers/receive-webhook";
import { verifyStripeDelivery } from "../../providers/stripe/stripe-webhook";

export type CreateStripeWebhookHandlerInput = {
  /** Defaults to `STRIPE_WEBHOOK_SECRET`. */
  secret?: string;
  db?: Db;
};

/**
 * `POST` endpoint for Stripe's signed Connect webhook (ADR 0028), kept for the URL registered at
 * Stripe: the generic provider webhook (ADR 0100) with Stripe's verification. Without a secret it
 * answers 503.
 */
export function createStripeWebhookHandler({ secret, db }: CreateStripeWebhookHandlerInput = {}) {
  return createProviderWebhookHandler({
    provider: "STRIPE",
    ...(db ? { db } : {}),
    verify: ({ payload, headers }) =>
      verifyStripeDelivery({ payload, headers, ...(secret ? { secret } : {}) }),
  });
}
