import { z } from "zod";

/** The part of a Stripe Billing event we read (ADR 0095 §8); everything else is ignored. */
export const BillingEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({ object: z.record(z.string(), z.unknown()) }),
});
export type BillingEvent = z.infer<typeof BillingEventSchema>;

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
]);

type ValueInput = { value: unknown };

const text = ({ value }: ValueInput) => (typeof value === "string" && value ? value : null);

/** A Stripe reference: the id string, or the expanded object's `id`. */
const idOf = ({ value }: ValueInput) =>
  text({ value }) ??
  (value && typeof value === "object" ? text({ value: (value as { id?: unknown }).id }) : null);

/** Where the subscription id sits on each kind of object (invoices moved it under `parent`). */
function subscriptionIdOf({ event }: { event: BillingEvent }): string | null {
  const object = event.data.object;
  if (event.type.startsWith("customer.subscription.")) return text({ value: object.id });
  if (event.type.startsWith("invoice.")) {
    const parent = object.parent as { subscription_details?: { subscription?: unknown } } | null;
    return (
      idOf({ value: object.subscription }) ??
      idOf({ value: parent?.subscription_details?.subscription })
    );
  }
  return idOf({ value: object.subscription });
}

export type BillingAction = { subscriptionId: string; customerId: string | null };

/** The subscription an event concerns, or null for events we do not act on. */
export function toBillingAction({ event }: { event: BillingEvent }): BillingAction | null {
  if (!HANDLED.has(event.type)) return null;
  const subscriptionId = subscriptionIdOf({ event });
  if (!subscriptionId) return null;
  return { subscriptionId, customerId: idOf({ value: event.data.object.customer }) };
}
