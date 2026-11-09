import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { accountProvider } from "./account-provider";
import { refreshAccountStatus } from "./refresh-status";
import { PaymentAccountStatusSchema } from "./schema";
import { toPaymentAccountDto } from "./to-payment-account-dto";

const AccountSignalSchema = z.object({
  providerAccountId: z.string().min(1).describe("The provider's account id (Stripe `acct_...`)"),
});

const AccountSignalResultSchema = z.object({
  status: PaymentAccountStatusSchema,
  changed: z.boolean(),
});

/**
 * Refreshes a payout account's status after a provider account event (ADR 0028). SYSTEM only, like
 * `payment.applySignal`. The event only says which account changed: the status is read back from
 * the provider, so the webhook payload is never trusted for it.
 */
export const applyPaymentAccountSignal = defineOperation({
  name: "paymentAccount.applySignal",
  kind: "command",
  description: "Refresh a payout account's status after a Stripe account event (webhook only).",
  input: AccountSignalSchema,
  output: AccountSignalResultSchema,
  permission: "paymentAccount:write",
  entityType: "paymentAccount",
  approval: false,
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Payout accounts are updated by the provider's webhook only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const provider = accountProvider();
    if (!provider.ok) return provider;
    const before = await context.db.providerConnection.findFirst({
      where: { provider: provider.value.key, externalAccountId: input.providerAccountId },
    });
    if (!before) return notFound({ entity: "Payment account" });
    const refreshed = await refreshAccountStatus({ context, before });
    if (!refreshed.ok) return refreshed;
    const { row, changed } = refreshed.value;
    const { status } = toPaymentAccountDto({ row, organizationId: context.organizationId });
    return ok({ value: { status, changed } });
  },
});
