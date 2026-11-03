import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { applySubscription } from "./apply-subscription";
import { getBillingGateway } from "./gateway-registry";
import { loadBillingRow } from "./load-billing";
import { BillingGetInputSchema, BillingSchema } from "./schema";
import { isTerminalStatus } from "./subscription-status";
import { syncSeats } from "./sync-seats";
import { loadBillingDto } from "./to-billing-dto";

/**
 * Reads the organization's subscription back from Stripe (ADR 0095 §8). The web app runs it when
 * Checkout returns, so access opens before the webhook arrives; the webhook does the same later.
 * Stays in the handler like `paymentAccount.sync`: it only reads from Stripe.
 */
export const syncBilling = defineOperation({
  name: "billing.sync",
  kind: "command",
  entityType: "billingAccount",
  description:
    "Refresh the subscription's status from Stripe, e.g. right after paying in Checkout.",
  input: BillingGetInputSchema,
  output: BillingSchema,
  permission: "billing:write",
  approval: false,
  handler: async ({ context }) => {
    const row = await loadBillingRow({ context });
    if (!row?.stripeCustomerId) return ok({ value: await loadBillingDto({ context, row }) });
    const gateway = getBillingGateway();
    const stored =
      row.stripeSubscriptionId && !isTerminalStatus({ status: row.subscriptionStatus });
    const found =
      stored && row.stripeSubscriptionId
        ? await gateway.getSubscription({ subscriptionId: row.stripeSubscriptionId })
        : await gateway.findSubscription({ customerId: row.stripeCustomerId });
    if (!found.ok) return err({ error: found.error });
    if (found.value) await applySubscription({ context, subscription: found.value });
    return ok({ value: await loadBillingDto({ context }) });
  },
  followUp: ({ context }) => syncSeats({ context }),
});
