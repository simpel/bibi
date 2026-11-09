import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { VerifiedDelivery, WebhookPort } from "../types";
import { verifyStripeSignature } from "./stripe-signature";
import { StripeEventSchema, toStripeSignals } from "./stripe-webhook-event";

function parseJson({ payload }: { payload: string }): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return undefined;
  }
}

export type VerifyStripeDeliveryInput = { payload: string; headers: Headers; secret?: string };

/**
 * A Stripe Connect webhook delivery (ADR 0028): the signature over the raw body against
 * `STRIPE_WEBHOOK_SECRET` (or `secret`), the event checked with Zod, then its signals.
 */
export function verifyStripeDelivery({
  payload,
  headers,
  secret,
}: VerifyStripeDeliveryInput): Result<VerifiedDelivery> {
  const key = secret ?? getEnv().STRIPE_WEBHOOK_SECRET;
  if (!key) {
    return err({ error: new AppError({ code: "UNAVAILABLE", message: "No webhook secret" }) });
  }
  const header = headers.get("stripe-signature");
  const verified = verifyStripeSignature({ payload, header, secret: key });
  if (!verified.ok) return verified;
  const event = StripeEventSchema.safeParse(parseJson({ payload }));
  if (!event.success) {
    return err({ error: new AppError({ code: "VALIDATION", message: "Not a Stripe event" }) });
  }
  const signals = toStripeSignals({ event: event.data });
  return ok({ value: { eventId: event.data.id, type: event.data.type, signals } });
}

export const stripeWebhook: WebhookPort = {
  isConfigured: () => Boolean(getEnv().STRIPE_WEBHOOK_SECRET),
  verify: ({ payload, headers }) => verifyStripeDelivery({ payload, headers }),
};
