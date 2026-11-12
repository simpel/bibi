import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";

/** Accounts v2 preview version (docs.stripe.com/connect/accounts-v2); v1 calls use it too. */
export const STRIPE_API_VERSION = "2026-08-26.preview";

export type StripeRequestInput = {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  idempotencyKey?: string;
};

export type StripeFetchInput = {
  method: "GET" | "POST";
  /** Path from the API root, with its version: `/v1/refunds`, `/v2/core/accounts`. */
  path: string;
  /** Extra headers, e.g. `Content-Type` or `Stripe-Account` for a direct charge. */
  headers?: Record<string, string>;
  body?: string;
  idempotencyKey?: string | undefined;
  /** Bibi's billing key from `BillingConfig` (ADR 0095); without it, the Connect env key. */
  secretKey?: string | undefined;
};

type StripeErrorBody = { error?: { message?: string; code?: string } };

/** Kept on a refusal's `cause`, so a port can tell "no such account" from other refusals. */
export type StripeRefusal = { status: number; code: string | undefined };

type UnavailableInput = { message: string };
const unavailable = ({ message }: UnavailableInput) =>
  err({ error: new AppError({ code: "UNAVAILABLE", message }) });

/**
 * A 4xx is Stripe's definite no (CONFLICT); a 409 (idempotency clash), a 429 and a 5xx may still
 * have done the work or may succeed on retry (UNAVAILABLE). A refund stays PENDING on those.
 */
function refused({ status, message, code }: StripeRefusal & { message: string }) {
  const definite = status >= 400 && status < 500 && status !== 409 && status !== 429;
  const cause: StripeRefusal = { status, code };
  return definite
    ? err({ error: new AppError({ code: "CONFLICT", message, cause }) })
    : err({ error: new AppError({ code: "UNAVAILABLE", message, cause }) });
}

/** The Connect platform key from env (ADR 0028), or null when Connect is not configured. */
function connectKey(): string | null {
  const { STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID } = getEnv();
  return STRIPE_SECRET_KEY && STRIPE_PLATFORM_ACCOUNT_ID ? STRIPE_SECRET_KEY : null;
}

/** One Stripe call with the platform key (v1 or v2). Failures become `AppError`, never exceptions. */
export async function stripeFetch({
  method,
  path,
  headers = {},
  body,
  idempotencyKey,
  secretKey,
}: StripeFetchInput): Promise<Result<Record<string, unknown>>> {
  const base = getEnv().STRIPE_API_BASE_URL;
  if (!base) return unavailable({ message: "Stripe is not configured (STRIPE_API_BASE_URL)." });
  const key = secretKey ?? connectKey();
  if (!key) {
    return unavailable({
      message: "Stripe is not configured (STRIPE_SECRET_KEY, STRIPE_PLATFORM_ACCOUNT_ID).",
    });
  }
  try {
    const response = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
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
    return refused({ status: response.status, message, code: json.error?.code });
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
    path: `/v2${path}`,
    idempotencyKey,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}
