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
  object: z.string().optional(),
  status: z.string().nullish(),
  payment_status: z.string().optional(),
  amount: z.number().int().optional(),
  amount_paid: z.number().int().optional(),
  amount_refunded: z.number().int().optional(),
  invoice: z.string().nullish(),
  metadata: z.record(z.string(), z.string()).nullish(),
});

type StripeObject = z.infer<typeof ObjectSchema>;

type Mapped = { kind: SignalKind; fields: Partial<ProviderSignal> };

const meta = ({ object }: { object: StripeObject }) => ({
  ...(object.metadata?.paymentId ? { paymentId: object.metadata.paymentId } : {}),
  ...(object.metadata?.refundId ? { refundId: object.metadata.refundId } : {}),
});

const REFUND_EVENTS = new Set([
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.refund.updated",
]);

/** A refund object: its own id, amount and outcome (a refund Bibi started carries our ids). */
function refundSignal({ object }: { object: StripeObject }): Mapped | null {
  if (!object.id) return null;
  const fields = { reference: object.id, ...meta({ object }), amountMinor: object.amount };
  if (object.status === "succeeded") return { kind: "refund.succeeded", fields };
  if (object.status === "failed" || object.status === "canceled") {
    return { kind: "refund.failed", fields };
  }
  return null;
}

/** An invoice raised through the invoicing port (ADR 0100): paid or voided at Stripe. */
function invoiceSignal({ type, object }: { type: string; object: StripeObject }): Mapped | null {
  if (!object.id) return null;
  const fields = { reference: object.id, documentReference: object.id };
  if (type === "invoice.paid") {
    return {
      kind: "invoice.payment_recorded",
      fields: { ...fields, amountMinor: object.amount_paid },
    };
  }
  return type === "invoice.voided" ? { kind: "invoice.voided", fields } : null;
}

function mapEvent({ type, object }: { type: string; object: StripeObject }): Mapped | null {
  if (REFUND_EVENTS.has(type)) return refundSignal({ object });
  if (type === "invoice.paid" || type === "invoice.voided") return invoiceSignal({ type, object });
  const attempt = { reference: object.id };
  if (type === "checkout.session.async_payment_succeeded") {
    return { kind: "attempt.succeeded", fields: attempt };
  }
  if (type === "checkout.session.completed") {
    return object.payment_status === "paid" ? { kind: "attempt.succeeded", fields: attempt } : null;
  }
  if (type === "checkout.session.expired") return { kind: "attempt.expired", fields: attempt };
  if (type === "checkout.session.async_payment_failed") {
    return { kind: "attempt.failed", fields: attempt };
  }
  if (type !== "charge.refunded") return null;
  // A refunded total on the charge: refunds made in Stripe's dashboard become one step each.
  return {
    kind: "refund.succeeded",
    fields: {
      ...(object.invoice ? { reference: object.invoice } : {}),
      ...meta({ object }),
      ...(object.amount_refunded !== undefined
        ? { refundedTotalMinor: object.amount_refunded }
        : {}),
    },
  };
}

export type ToSignalsInput = { event: StripeEvent; now?: Date };

/**
 * The normalized signals of a Stripe event (ADR 0100), or none for events Bibi does not act on.
 * Attempts are matched by the Checkout Session id, invoices by the Invoice id and refunds by the
 * refund id or the ids Bibi put in the metadata; a charge's refunded total covers refunds made in
 * Stripe itself. An account event only names the account: its status is read back from Stripe.
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
  const mapped = mapEvent({ type, object: parsed.data });
  if (!mapped) return [];
  const { fields } = mapped;
  if (!fields.reference && !fields.paymentId && !fields.refundId) return [];
  const defined = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  return [{ ...base, ...defined, kind: mapped.kind, externalAccountId: account }];
}
