import { z } from "zod";
import { err, ok } from "../../errors/result";
import type { CreateCheckoutInput } from "./charge-types";
import { stripeBadResponse } from "./stripe-bad-response";
import { stripeFormRequest } from "./stripe-form-request";

const CheckoutSessionSchema = z.object({
  id: z.string(),
  url: z.string(),
  expires_at: z.number(),
});

/** Checkout Session parameters for a one-line direct charge with an optional application fee. */
export function checkoutParams({
  amountMinor,
  currency,
  applicationFeeMinor,
  description,
  metadata,
  successUrl,
  cancelUrl,
}: CreateCheckoutInput) {
  return {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: amountMinor,
          product_data: { name: description },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { application_fee_amount: applicationFeeMinor, metadata },
  };
}

/**
 * Stripe charges (ADR 0028, 0029). Every call carries `Stripe-Account`, so checkouts are direct
 * charges on the venue's connected account; the application fee is optional.
 */
export const stripeCharges = {
  async createCheckout({ ...input }: CreateCheckoutInput) {
    const result = await stripeFormRequest({
      path: "/checkout/sessions",
      params: checkoutParams(input),
      connectedAccountId: input.connectedAccountId,
      idempotencyKey: input.idempotencyKey,
    });
    if (!result.ok) return err({ error: result.error });
    const parsed = CheckoutSessionSchema.safeParse(result.value);
    if (!parsed.success) return stripeBadResponse({ what: "checkout session" });
    const { id, url, expires_at } = parsed.data;
    return ok({
      value: { providerReference: id, url, expiresAt: new Date(expires_at * 1000) },
    });
  },
};
