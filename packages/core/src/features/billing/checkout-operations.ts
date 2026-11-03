import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { portalReturnUrl } from "./billing-urls";
import { checkoutExternal } from "./checkout-external";
import { getBillingGateway } from "./gateway-registry";
import { loadBillingRow } from "./load-billing";
import {
  BillingCheckoutInputSchema,
  BillingPortalInputSchema,
  BillingRedirectSchema,
} from "./schema";

/** Statuses that already pay: a second checkout would make a second subscription. */
const SUBSCRIBED = new Set(["active", "trialing", "past_due", "incomplete"]);

export const startBillingCheckout = defineOperation({
  name: "billing.startCheckout",
  kind: "command",
  entityType: "billingAccount",
  description:
    "Start paying for Bibi: returns a Stripe Checkout link for the monthly plan or the yearly " +
    "plan (10 % off). Paying during the trial charges nothing until the trial ends.",
  input: BillingCheckoutInputSchema,
  output: BillingRedirectSchema,
  permission: "billing:write",
  aiAllowed: false,
  handler: async ({ context }) => {
    const row = await context.db.billingAccount.upsert({
      where: { organizationId: context.organizationId },
      create: { organizationId: context.organizationId },
      update: {},
    });
    context.recordChange({ entityId: row.id, after: row });
    if (row.subscriptionStatus && SUBSCRIBED.has(row.subscriptionStatus)) {
      return conflict({ message: "Already subscribed: change the plan in the billing portal" });
    }
    return ok({ value: { url: null } });
  },
  external: checkoutExternal,
});

export const openBillingPortal = defineOperation({
  name: "billing.openPortal",
  kind: "command",
  entityType: "billingAccount",
  description:
    "Open Stripe's billing portal for the organization: card, invoices, plan and cancelling. " +
    "Returns a short-lived link; needs a paid subscription or a started checkout.",
  input: BillingPortalInputSchema,
  output: BillingRedirectSchema,
  permission: "billing:write",
  aiAllowed: false,
  approval: false,
  handler: async ({ context }) => {
    const row = await loadBillingRow({ context });
    if (!row?.stripeCustomerId) return notFound({ entity: "Billing customer" });
    return ok({ value: { url: null } });
  },
  external: async ({ input, context }) => {
    const row = await loadBillingRow({ context });
    if (!row?.stripeCustomerId) return notFound({ entity: "Billing customer" });
    const returnUrl = await portalReturnUrl({ organizationId: context.organizationId, ...input });
    const portal = await getBillingGateway().createPortal({
      customerId: row.stripeCustomerId,
      returnUrl,
    });
    return portal.ok ? ok({ value: { url: portal.value.url } }) : err({ error: portal.error });
  },
});
