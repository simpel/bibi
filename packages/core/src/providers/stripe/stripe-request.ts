import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

/** Accounts v2 preview version (docs.stripe.com/connect/accounts-v2); v1 calls use it too. */
export const STRIPE_API_VERSION = "2026-08-26.preview";
const STRIPE_V2_URL = "https://api.stripe.com/v2";

export type StripeRequestInput = {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  idempotencyKey?: string;
};

export type StripeFetchInput = {
  method: "GET" | "POST";
  url: string;
  /** Extra headers, e.g. `Content-Type` or `Stripe-Account` for a direct charge. */
  headers?: Record<string, string>;
  body?: string;
  idempotencyKey?: string | undefined;
  /** Bibi's billing key from `BillingConfig` (ADR 0095); without it, the Connect env key. */
  secretKey?: string | undefined;
};

type StripeErrorBody = { error?: { message?: string } };

type UnavailableInput = { message: string };
const unavailable = ({ message }: UnavailableInput) =>
  err({ error: new AppError({ code: "UNAVAILABLE", message }) });

/**
 * A 4xx is Stripe's definite no (CONFLICT); a 409 (idempotency clash), a 429 and a 5xx may still
 * have done the work or may succeed on retry (UNAVAILABLE). A refund stays PENDING on those.
 */
function refused({ status, message }: { status: number; message: string }) {
  const definite = status >= 400 && status < 500 && status !== 409 && status !== 429;
  return definite
    ? err({ error: new AppError({ code: "CONFLICT", message }) })
    : unavailable({ message });
}

/** The Connect platform key from env (ADR 0028), or null when Connect is not configured. */
function connectKey(): string | null {
  const { STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID } = getEnv();
  return STRIPE_SECRET_KEY && STRIPE_PLATFORM_ACCOUNT_ID ? STRIPE_SECRET_KEY : null;
}

/** One Stripe call with the platform key (v1 or v2). Failures become `AppError`, never exceptions. */
export async function stripeFetch({
  method,
  url,
  headers = {},
  body,
  idempotencyKey,
  secretKey,
}: StripeFetchInput): Promise<Result<Record<string, unknown>>> {
  const key = secretKey ?? connectKey();
  if (!key) {
    return unavailable({
      message: "Stripe is not configured (STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID).",
    });
  }
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Stripe-Version": STRIPE_API_VERSION,
        ...headers,
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      ...(body === undefined ? {} : { body }),
    });
    const json = (await response.json()) as Record<string, unknown> & StripeErrorBody;
    if (response.ok) return ok({ value: json });
    const message = `Stripe refused the request: ${json.error?.message ?? response.status}`;
    return refused({ status: response.status, message });
  } catch (cause) {
    return err({
      error: new AppError({ code: "UNAVAILABLE", message: "Stripe is unreachable.", cause }),
    });
  }
}

/** One Stripe v2 (JSON) call with the platform key. */
export async function stripeRequest({
  method,
  path,
  body,
  idempotencyKey,
}: StripeRequestInput): Promise<Result<Record<string, unknown>>> {
  return stripeFetch({
    method,
    url: `${STRIPE_V2_URL}${path}`,
    idempotencyKey,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}
