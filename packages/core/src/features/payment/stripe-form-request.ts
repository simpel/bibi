import type { Result } from "../../errors/result";
import { stripeFetch } from "../payment-account/stripe-request";

const STRIPE_V1_URL = "https://api.stripe.com/v1";

export type FormValue = string | number | boolean | undefined | FormParams | FormValue[];
export type FormParams = { [key: string]: FormValue };

type AppendInput = { form: URLSearchParams; key: string; value: FormValue };

function append({ form, key, value }: AppendInput): void {
  if (value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      append({ form, key: `${key}[${index}]`, value: item });
    });
    return;
  }
  if (typeof value === "object") {
    for (const [child, nested] of Object.entries(value)) {
      append({ form, key: `${key}[${child}]`, value: nested });
    }
    return;
  }
  form.append(key, String(value));
}

export type ToFormInput = { params: FormParams };

/** Stripe v1 form encoding: nested objects and arrays become `a[b][0][c]=…`. */
export function toStripeForm({ params }: ToFormInput): URLSearchParams {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) append({ form, key, value });
  return form;
}

export type StripeFormRequestInput = {
  path: string;
  params: FormParams;
  /** Connected account the call acts on (`Stripe-Account`): a direct charge (ADR 0028). */
  connectedAccountId: string;
  idempotencyKey?: string | undefined;
};

/** One Stripe v1 POST on behalf of a connected account. */
export function stripeFormRequest({
  path,
  params,
  connectedAccountId,
  idempotencyKey,
}: StripeFormRequestInput): Promise<Result<Record<string, unknown>>> {
  return stripeFetch({
    method: "POST",
    url: `${STRIPE_V1_URL}${path}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Account": connectedAccountId,
    },
    body: toStripeForm({ params }).toString(),
    idempotencyKey,
  });
}
