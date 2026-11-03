import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import { stripeBadResponse } from "../payment/stripe-bad-response";
import type { BillingKeys } from "./billing-config";
import type { BillingSubscription } from "./gateway";
import { billingStripeRequest } from "./stripe-billing-request";
import { isTerminalStatus } from "./subscription-status";

const ItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().optional(),
  current_period_end: z.number().optional(),
  price: z.object({ id: z.string() }),
});

const SubscriptionSchema = z.object({
  id: z.string(),
  customer: z.union([z.string(), z.object({ id: z.string() })]),
  status: z.string(),
  cancel_at_period_end: z.boolean().default(false),
  metadata: z.record(z.string(), z.string()).default({}),
  items: z.object({ data: z.array(ItemSchema) }),
});
type StripeSubscription = z.infer<typeof SubscriptionSchema>;

const fromUnix = ({ seconds }: { seconds: number | undefined }) =>
  seconds ? new Date(seconds * 1000) : null;

function toSubscription({ raw, keys }: { raw: StripeSubscription; keys: BillingKeys }) {
  const items = raw.items.data;
  const base = items.find(
    (item) => item.price.id === keys.prices.baseMonthly || item.price.id === keys.prices.baseYearly,
  );
  const seat = items.find((item) => item.price.id === keys.prices.seat);
  const subscription: BillingSubscription = {
    subscriptionId: raw.id,
    customerId: typeof raw.customer === "string" ? raw.customer : raw.customer.id,
    organizationId: raw.metadata.organizationId ?? null,
    status: raw.status,
    interval: !base ? null : base.price.id === keys.prices.baseYearly ? "YEAR" : "MONTH",
    currentPeriodEnd: fromUnix({ seconds: base?.current_period_end }),
    cancelAtPeriodEnd: raw.cancel_at_period_end,
    seatQuantity: seat?.quantity ?? 0,
  };
  return { subscription, seatItemId: seat?.id ?? null };
}

type ReadInput = { keys: BillingKeys; subscriptionId: string };

/** Reads a subscription with its items from Stripe. */
export async function readSubscription({ keys, subscriptionId }: ReadInput) {
  const fetched = await billingStripeRequest({
    secretKey: keys.secretKey,
    method: "GET",
    path: `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  });
  if (!fetched.ok) return fetched;
  const parsed = SubscriptionSchema.safeParse(fetched.value);
  if (!parsed.success) return stripeBadResponse({ what: "subscription" });
  return ok({ value: toSubscription({ raw: parsed.data, keys }) });
}

type SetSeatsInput = ReadInput & { quantity: number };

/** Puts the seat item at `quantity`, adding it on the first seat (prorated). */
export async function writeSeats({
  keys,
  subscriptionId,
  quantity,
}: SetSeatsInput): Promise<Result<true>> {
  const read = await readSubscription({ keys, subscriptionId });
  if (!read.ok) return read;
  const { subscription, seatItemId } = read.value;
  if (subscription.seatQuantity === quantity) return ok({ value: true });
  const { secretKey } = keys;
  // A zero quantity keeps the item at no charge, so a later seat updates it in place.
  const written = seatItemId
    ? await billingStripeRequest({
        ...{ secretKey, method: "POST", path: `/subscription_items/${seatItemId}` },
        params: { quantity },
      })
    : await billingStripeRequest({
        ...{ secretKey, method: "POST", path: "/subscription_items" },
        params: { subscription: subscriptionId, price: keys.prices.seat, quantity },
      });
  return written.ok ? ok({ value: true }) : written;
}

const ListSchema = z.object({ data: z.array(z.object({ id: z.string(), status: z.string() })) });

type FindInput = { keys: BillingKeys; customerId: string };

/** The customer's newest live subscription, else the newest in any status. */
export async function findCustomerSubscription({ keys, customerId }: FindInput) {
  const listed = await billingStripeRequest({
    secretKey: keys.secretKey,
    method: "GET",
    path: "/subscriptions",
    params: { customer: customerId, status: "all", limit: 10 },
  });
  if (!listed.ok) return listed;
  const parsed = ListSchema.safeParse(listed.value);
  if (!parsed.success) return stripeBadResponse({ what: "subscription list" });
  const subscriptions = parsed.data.data;
  const newest = subscriptions.find((sub) => !isTerminalStatus(sub)) ?? subscriptions[0];
  if (!newest) return ok({ value: null });
  const read = await readSubscription({ keys, subscriptionId: newest.id });
  return read.ok ? ok({ value: read.value.subscription }) : read;
}
