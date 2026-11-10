import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { applySubscription } from "./apply-subscription";
import { getBillingGateway } from "./gateway-registry";
import { syncSeats } from "./sync-seats";

const BillingSignalSchema = z.object({
  subscriptionId: z.string().min(1).describe("Stripe subscription (`sub_...`)"),
});

const BillingSignalResultSchema = z.object({ changed: z.boolean() });

/**
 * Mirrors a subscription after a Stripe Billing event (ADR 0091 §4, 0095 §8). SYSTEM only, like
 * `integration.applySignal`: the event only names the subscription, whose state is read back
 * from Stripe. The seats follow the stored count afterwards (a yearly plan gets its seat item).
 */
export const applyBillingSignal = defineOperation({
  name: "billing.applySignal",
  kind: "command",
  entityType: "billingAccount",
  description: "Mirror a subscription after a Stripe Billing event (webhook only).",
  input: BillingSignalSchema,
  output: BillingSignalResultSchema,
  permission: "billing:write",
  approval: false,
  aiAllowed: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Subscriptions are updated by the Stripe webhook only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const fetched = await getBillingGateway().getSubscription(input);
    if (!fetched.ok) return err({ error: fetched.error });
    if (fetched.value.organizationId !== context.organizationId) {
      const message = "The subscription belongs to another organization";
      return err({ error: new AppError({ code: "NOT_FOUND", message }) });
    }
    const changed = await applySubscription({ context, subscription: fetched.value });
    return ok({ value: { changed } });
  },
  followUp: ({ context }) => syncSeats({ context }),
});
