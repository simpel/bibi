import { z } from "zod";
import type { PaymentSignalSchema } from "./webhook-schema";

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

const PAID = new Set(["checkout.session.async_payment_succeeded", "invoice.paid"]);
const CANCELLED = new Set(["checkout.session.expired", "invoice.voided"]);

export type StripeAction =
  | { target: "payment"; signal: z.infer<typeof PaymentSignalSchema> }
  | { target: "account"; providerAccountId: string };

export type ToActionInput = { event: StripeEvent };

function paymentKind({ type, object }: { type: string; object: z.infer<typeof ObjectSchema> }) {
  if (PAID.has(type)) return "paid" as const;
  if (type === "checkout.session.completed") {
    return object.payment_status === "paid" ? ("paid" as const) : null;
  }
  if (CANCELLED.has(type)) return "cancelled" as const;
  if (type === "checkout.session.async_payment_failed") return "failed" as const;
  return type === "charge.refunded" ? ("refunded" as const) : null;
}

/**
 * The effect an event has on Okazi, or null for events we do not act on (acknowledged and
 * ignored). Payments are matched by the Checkout Session or Invoice id; refunds arrive on a charge,
 * which names its invoice or carries our `paymentId` metadata.
 */
export function toStripeAction({ event }: ToActionInput): StripeAction | null {
  const { type, account } = event;
  if (type === "account.updated" || type.startsWith("v2.core.account")) {
    const providerAccountId = account ?? event.related_object?.id;
    return providerAccountId ? { target: "account", providerAccountId } : null;
  }
  const parsed = ObjectSchema.safeParse(event.data?.object);
  if (!account || !parsed.success) return null;
  const object = parsed.data;
  const kind = paymentKind({ type, object });
  if (!kind) return null;
  const isCharge = type === "charge.refunded";
  const providerReference = isCharge ? (object.invoice ?? undefined) : object.id;
  const paymentId = isCharge ? object.metadata?.paymentId : undefined;
  if (!providerReference && !paymentId) return null;
  const refundedMinor = isCharge ? object.amount_refunded : undefined;
  return {
    target: "payment",
    signal: { kind, providerAccountId: account, providerReference, paymentId, refundedMinor },
  };
}
