import { createId } from "@paralleldrive/cuid2";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import type { BillingGateway, BillingSubscription, CreateBillingCheckoutInput } from "./gateway";

export type MemoryBillingGateway = BillingGateway & {
  checkouts: CreateBillingCheckoutInput[];
  seats: { subscriptionId: string; quantity: number }[];
  /** What Stripe would hold; tests put a subscription here to mimic a finished checkout. */
  subscriptions: Map<string, BillingSubscription>;
  configured: boolean;
};

/** An in-memory billing gateway for tests and the demo seed (no network). */
export function createMemoryBillingGateway(): MemoryBillingGateway {
  const gateway: MemoryBillingGateway = {
    checkouts: [],
    seats: [],
    subscriptions: new Map(),
    configured: true,
    isConfigured: async () => gateway.configured,
    createCustomer: async () => ok({ value: { customerId: `cus_memory_${createId()}` } }),
    createCheckout: async (input) => {
      gateway.checkouts.push(input);
      return ok({ value: { url: `https://checkout.stripe.test/${input.customerId}` } });
    },
    createPortal: async ({ customerId }) =>
      ok({ value: { url: `https://billing.stripe.test/${customerId}` } }),
    getSubscription: async ({ subscriptionId }) => {
      const found = gateway.subscriptions.get(subscriptionId);
      if (found) return ok({ value: found });
      return err({ error: new AppError({ code: "NOT_FOUND", message: "No subscription" }) });
    },
    findSubscription: async ({ customerId }) =>
      ok({
        value:
          [...gateway.subscriptions.values()].find((sub) => sub.customerId === customerId) ?? null,
      }),
    setSeats: async ({ subscriptionId, quantity }) => {
      gateway.seats.push({ subscriptionId, quantity });
      const found = gateway.subscriptions.get(subscriptionId);
      if (found) gateway.subscriptions.set(subscriptionId, { ...found, seatQuantity: quantity });
      return ok({ value: true });
    },
  };
  return gateway;
}
