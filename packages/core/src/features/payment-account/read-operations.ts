import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { PaymentAccountGetInputSchema, PaymentAccountSchema } from "./schema";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export const getPaymentAccount = defineOperation({
  name: "paymentAccount.get",
  kind: "query",
  description:
    "The organization's payout account (Stripe Connect): NOT_CONNECTED, ONBOARDING, ACTIVE or " +
    "RESTRICTED. Reads the stored status; use paymentAccount.sync to refresh it from Stripe.",
  input: PaymentAccountGetInputSchema,
  output: PaymentAccountSchema,
  permission: "paymentAccount:read",
  entityType: "paymentAccount",
  handler: async ({ context }) => {
    const row = await context.db.paymentAccount.findFirst({});
    return ok({ value: toPaymentAccountDto({ row, organizationId: context.organizationId }) });
  },
});
