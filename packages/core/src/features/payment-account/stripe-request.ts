import { getEnv } from "@okazi/config";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

/** Accounts v2 preview version (docs.stripe.com/connect/accounts-v2). */
export const STRIPE_API_VERSION = "2026-08-26.preview";
const STRIPE_V2_URL = "https://api.stripe.com/v2";

export type StripeRequestInput = {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  idempotencyKey?: string;
};

type StripeErrorBody = { error?: { message?: string } };

type UnavailableInput = { message: string };
const unavailable = ({ message }: UnavailableInput) =>
  err({ error: new AppError({ code: "UNAVAILABLE", message }) });

/** One Stripe v2 call with the platform key. Failures become `AppError`, never exceptions. */
export async function stripeRequest({
  method,
  path,
  body,
  idempotencyKey,
}: StripeRequestInput): Promise<Result<Record<string, unknown>>> {
  const { STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID } = getEnv();
  if (!STRIPE_SECRET_KEY || !STRIPE_PLATFORM_ACCOUNT_ID) {
    return unavailable({
      message: "Stripe is not configured (STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID).",
    });
  }
  try {
    const response = await fetch(`${STRIPE_V2_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Stripe-Version": STRIPE_API_VERSION,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const json = (await response.json()) as Record<string, unknown> & StripeErrorBody;
    if (response.ok) return ok({ value: json });
    return unavailable({
      message: `Stripe refused the request: ${json.error?.message ?? response.status}`,
    });
  } catch (cause) {
    return err({
      error: new AppError({ code: "UNAVAILABLE", message: "Stripe is unreachable.", cause }),
    });
  }
}
