import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { loadAccountRow } from "./account-provider";
import { PaymentAccountDisconnectInputSchema, PaymentAccountSchema } from "./schema";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export const disconnectPaymentAccount = defineOperation({
  name: "paymentAccount.disconnect",
  kind: "command",
  description:
    "Disconnect the organization's Stripe account (ADR 0090): Bibi stops creating payment " +
    "links and Stripe invoices on it, and its status reads DISCONNECTED. The account itself " +
    "stays the venue's in Stripe; links already sent keep working until they expire and are " +
    "still recorded. paymentAccount.startOnboarding connects the same account again.",
  input: PaymentAccountDisconnectInputSchema,
  output: PaymentAccountSchema,
  permission: "paymentAccount:write",
  entityType: "paymentAccount",
  handler: async ({ context }) => {
    const { organizationId } = context;
    const before = await loadAccountRow({ context });
    if (!before) return notFound({ entity: "Payment account" });
    if (before.disconnectedAt)
      return ok({ value: toPaymentAccountDto({ row: before, organizationId }) });
    const row = await context.db.providerConnection.update({
      where: { id: before.id },
      data: { disconnectedAt: nowOf({ context }) },
    });
    const after = toPaymentAccountDto({ row, organizationId });
    context.recordChange({
      entityId: row.id,
      before: toPaymentAccountDto({ row: before, organizationId }),
      after,
    });
    return ok({ value: after });
  },
});
