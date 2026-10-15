import { z } from "zod";
import { err, ok } from "../../errors/result";
import type { CreateCheckoutInput, PaymentProvider } from "./provider";
import { stripeBadResponse } from "./stripe-bad-response";
import { stripeFormRequest } from "./stripe-form-request";
import { createStripeInvoice } from "./stripe-invoice";

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
 * Stripe adapter (ADR 0028, 0029). Every call carries `Stripe-Account`, so checkouts and invoices
 * are direct charges on the venue's connected account; the application fee is optional.
 */
export const stripePaymentProvider: PaymentProvider = {
  async createCheckout({ ...input }) {
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
  createInvoice: (input) => createStripeInvoice(input),
};
