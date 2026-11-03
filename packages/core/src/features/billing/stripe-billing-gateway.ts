import { createHash } from "node:crypto";
import { z } from "zod";
import { ok } from "../../errors/result";
import { stripeBadResponse } from "../payment/stripe-bad-response";
import { loadBillingKeys } from "./billing-config";
import { withBillingKeys } from "./billing-keys";
import { checkoutParams } from "./checkout-params";
import type { BillingGateway, CreateBillingCheckoutInput } from "./gateway";
import { billingStripeRequest } from "./stripe-billing-request";
import { findCustomerSubscription, readSubscription, writeSeats } from "./stripe-subscription";

/** One customer per organization; changed details within Stripe's 24 h make a new key. */
type CustomerKeyInput = { organizationId: string; name: string; email?: string | undefined };

const customerKey = ({ organizationId, name, email }: CustomerKeyInput) => {
  const params = JSON.stringify({ organizationId, name, email });
  return `bibi-billing-customer-${createHash("sha256").update(params).digest("hex").slice(0, 32)}`;
};

const IdSchema = z.object({ id: z.string() });
const UrlSchema = z.object({ url: z.string().url() });

/** The default gateway: Stripe Billing v1 with the key a superadmin stored (ADR 0095). */
export const stripeBillingGateway: BillingGateway = {
  isConfigured: async () => {
    const keys = await loadBillingKeys();
    return keys.ok && keys.value !== null;
  },
  createCustomer: ({ organizationId, name, email }) =>
    withBillingKeys({
      run: async ({ secretKey }) => {
        const created = await billingStripeRequest({
          ...{ secretKey, method: "POST", path: "/customers" },
          params: { name, email, metadata: { organizationId } },
          idempotencyKey: customerKey({ organizationId, name, email }),
        });
        if (!created.ok) return created;
        const parsed = IdSchema.safeParse(created.value);
        if (!parsed.success) return stripeBadResponse({ what: "customer" });
        return ok({ value: { customerId: parsed.data.id } });
      },
    }),
  createCheckout: (input: CreateBillingCheckoutInput) =>
    withBillingKeys({
      run: async (keys) => {
        const created = await billingStripeRequest({
          ...{ secretKey: keys.secretKey, method: "POST", path: "/checkout/sessions" },
          params: checkoutParams({ input, keys }),
        });
        if (!created.ok) return created;
        const parsed = UrlSchema.safeParse(created.value);
        if (!parsed.success) return stripeBadResponse({ what: "checkout session" });
        return ok({ value: { url: parsed.data.url } });
      },
    }),
  createPortal: ({ customerId, returnUrl }) =>
    withBillingKeys({
      run: async ({ secretKey, portalConfigId }) => {
        const created = await billingStripeRequest({
          ...{ secretKey, method: "POST", path: "/billing_portal/sessions" },
          params: {
            customer: customerId,
            return_url: returnUrl,
            ...(portalConfigId ? { configuration: portalConfigId } : {}),
          },
        });
        if (!created.ok) return created;
        const parsed = UrlSchema.safeParse(created.value);
        if (!parsed.success) return stripeBadResponse({ what: "portal session" });
        return ok({ value: { url: parsed.data.url } });
      },
    }),
  getSubscription: ({ subscriptionId }) =>
    withBillingKeys({
      run: async (keys) => {
        const read = await readSubscription({ keys, subscriptionId });
        return read.ok ? ok({ value: read.value.subscription }) : read;
      },
    }),
  findSubscription: ({ customerId }) =>
    withBillingKeys({ run: (keys) => findCustomerSubscription({ keys, customerId }) }),
  setSeats: ({ subscriptionId, quantity }) =>
    withBillingKeys({ run: (keys) => writeSeats({ keys, subscriptionId, quantity }) }),
};
