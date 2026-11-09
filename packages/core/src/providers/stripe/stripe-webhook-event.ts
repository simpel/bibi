import { z } from "zod";
import type { ProviderSignal, SignalKind } from "../signal";

/** What every Stripe event carries; the rest of `data.object` is read per event type. */
export const StripeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  /** The connected account the event happened on (Connect events). */
  account: z.string().optional(),
  /** Thin events (Accounts v2) name the account here instead. */
  related_object: z.object({ id: z.string() }).optional(),
  data: z.object({ object: z.record(z.string(), z.unknown()) }).optional(),
});

export type StripeEvent = z.infer<typeof StripeEventSchema>;

const ObjectSchema = z.object({
  id: z.string().optional(),
  payment_status: z.string().optional(),
  amount_refunded: z.number().int().optional(),
  invoice: z.string().nullish(),
  metadata: z.record(z.string(), z.string()).nullish(),
});

type StripeObject = z.infer<typeof ObjectSchema>;

const PAID = new Set(["checkout.session.async_payment_succeeded", "invoice.paid"]);

function signalKind({ type, object }: { type: string; object: StripeObject }): SignalKind | null {
  if (PAID.has(type)) return "attempt.succeeded";
  if (type === "checkout.session.completed") {
    return object.payment_status === "paid" ? "attempt.succeeded" : null;
  }
  if (type === "checkout.session.expired") return "attempt.expired";
  if (type === "invoice.voided") return "attempt.cancelled";
  if (type === "checkout.session.async_payment_failed") return "attempt.failed";
  return type === "charge.refunded" ? "refund.succeeded" : null;
}

export type ToSignalsInput = { event: StripeEvent; now?: Date };

/**
 * The normalized signals of a Stripe event (ADR 0100), or none for events Bibi does not act on.
 * Attempts are matched by the Checkout Session or Invoice id; refunds arrive on a charge, which
 * names its invoice or carries our `paymentId` metadata. An account event only names the account:
 * its status is read back from Stripe, never trusted from the payload.
 */
export function toStripeSignals({ event, now = new Date() }: ToSignalsInput): ProviderSignal[] {
  const { type, account, id: eventId } = event;
  const base = { provider: "STRIPE" as const, eventId, occurredAt: now };
  if (type === "account.updated" || type.startsWith("v2.core.account")) {
    const externalAccountId = account ?? event.related_object?.id;
    return externalAccountId ? [{ ...base, kind: "connection.status", externalAccountId }] : [];
  }
  const parsed = ObjectSchema.safeParse(event.data?.object);
  if (!account || !parsed.success) return [];
  const object = parsed.data;
  const kind = signalKind({ type, object });
  if (!kind) return [];
  const isCharge = kind === "refund.succeeded";
  const reference = isCharge ? (object.invoice ?? undefined) : object.id;
  const paymentId = isCharge ? object.metadata?.paymentId : undefined;
  if (!reference && !paymentId) return [];
  return [
    {
      ...base,
      kind,
      externalAccountId: account,
      ...(reference ? { reference } : {}),
      ...(paymentId ? { paymentId } : {}),
      ...(isCharge && object.amount_refunded !== undefined
        ? { refundedTotalMinor: object.amount_refunded }
        : {}),
    },
  ];
}
