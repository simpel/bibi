import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { getStripeConnectGateway } from "./gateway-registry";
import { PaymentAccountStatusSchema } from "./schema";

const AccountSignalSchema = z.object({
  providerAccountId: z.string().min(1).describe("Stripe connected account (`acct_...`)"),
});

const AccountSignalResultSchema = z.object({
  status: PaymentAccountStatusSchema,
  changed: z.boolean(),
});

/**
 * Refreshes a payout account's status after a Stripe account event (ADR 0028). SYSTEM only, like
 * `payment.applySignal`. The event only says which account changed: the status is read back from
 * Stripe through the gateway, so the webhook payload is never trusted for it.
 */
export const applyPaymentAccountSignal = defineOperation({
  name: "paymentAccount.applySignal",
  kind: "command",
  description: "Refresh a payout account's status after a Stripe account event (webhook only).",
  input: AccountSignalSchema,
  output: AccountSignalResultSchema,
  permission: "payment:write",
  entityType: "paymentAccount",
  approval: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Payout accounts are updated by the Stripe webhook only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const stripeAccountId = input.providerAccountId;
    const before = await context.db.paymentAccount.findFirst({ where: { stripeAccountId } });
    if (!before) return notFound({ entity: "Payment account" });
    const fetched = await getStripeConnectGateway().getAccountStatus({ stripeAccountId });
    if (!fetched.ok) return err({ error: fetched.error });
    if (fetched.value.status === before.status) {
      return ok({ value: { status: before.status, changed: false } });
    }
    const row = await context.db.paymentAccount.update({
      where: { id: before.id },
      data: { status: fetched.value.status },
    });
    context.recordChange({ entityId: row.id, before, after: row });
    return ok({ value: { status: row.status, changed: true } });
  },
});
