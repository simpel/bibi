import type { Result } from "../../errors/result";
import { type FormParams, toStripeForm } from "../../providers/stripe/stripe-form-request";
import { stripeFetch } from "../../providers/stripe/stripe-request";

const STRIPE_V1_URL = "https://api.stripe.com/v1";

export type BillingStripeRequestInput = {
  secretKey: string;
  method: "GET" | "POST";
  path: string;
  params?: FormParams;
  idempotencyKey?: string | undefined;
};

/** One Stripe v1 call on Bibi's own account with the key from `BillingConfig` (ADR 0095). */
export function billingStripeRequest({
  secretKey,
  method,
  path,
  params = {},
  idempotencyKey,
}: BillingStripeRequestInput): Promise<Result<Record<string, unknown>>> {
  const form = toStripeForm({ params }).toString();
  const query = method === "POST" || !form ? "" : `?${form}`;
  return stripeFetch({
    method,
    url: `${STRIPE_V1_URL}${path}${query}`,
    secretKey,
    idempotencyKey,
    ...(method === "POST"
      ? { headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form }
      : {}),
  });
}
