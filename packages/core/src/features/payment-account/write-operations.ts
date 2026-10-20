import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { getStripeConnectGateway } from "./gateway-registry";
import {
  PaymentAccountOnboardingSchema,
  PaymentAccountSchema,
  PaymentAccountStartOnboardingInputSchema,
  PaymentAccountSyncInputSchema,
} from "./schema";
import { ensurePaymentAccount, onboardingReturnUrls } from "./start-onboarding";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export const startPaymentOnboarding = defineOperation({
  name: "paymentAccount.startOnboarding",
  kind: "command",
  description:
    "Connect the organization to Stripe so it can be paid directly: creates its connected " +
    "account on first use and returns a short-lived Stripe onboarding link (open it in a " +
    "browser; call again for a fresh link if it expired).",
  input: PaymentAccountStartOnboardingInputSchema,
  output: PaymentAccountOnboardingSchema,
  permission: "paymentAccount:write",
  entityType: "paymentAccount",
  handler: async ({ input, context }) => {
    const account = await ensurePaymentAccount({ input, context });
    if (!account.ok) return err({ error: account.error });
    const link = await getStripeConnectGateway().createOnboardingLink({
      stripeAccountId: account.value.stripeAccountId,
      ...onboardingReturnUrls(),
    });
    if (!link.ok) return err({ error: link.error });
    const row = await context.db.paymentAccount.findFirst({});
    const dto = toPaymentAccountDto({ row, organizationId: context.organizationId });
    return ok({
      value: { ...dto, onboardingUrl: link.value.url, onboardingExpiresAt: link.value.expiresAt },
    });
  },
});

export const syncPaymentAccount = defineOperation({
  name: "paymentAccount.sync",
  kind: "command",
  description:
    "Refresh the payout account's status from Stripe (ONBOARDING, ACTIVE or RESTRICTED). " +
    "Run it after the venue returns from the onboarding page.",
  input: PaymentAccountSyncInputSchema,
  output: PaymentAccountSchema,
  permission: "paymentAccount:write",
  entityType: "paymentAccount",
  approval: false,
  handler: async ({ context }) => {
    const before = await context.db.paymentAccount.findFirst({});
    if (!before) return notFound({ entity: "Payment account" });
    const fetched = await getStripeConnectGateway().getAccountStatus({
      stripeAccountId: before.stripeAccountId,
    });
    if (!fetched.ok) return err({ error: fetched.error });
    if (fetched.value.status === before.status) {
      return ok({
        value: toPaymentAccountDto({ row: before, organizationId: context.organizationId }),
      });
    }
    const row = await context.db.paymentAccount.update({
      where: { id: before.id },
      data: { status: fetched.value.status },
    });
    const { organizationId } = context;
    context.recordChange({
      entityId: row.id,
      before: toPaymentAccountDto({ row: before, organizationId }),
      after: toPaymentAccountDto({ row, organizationId }),
    });
    return ok({ value: toPaymentAccountDto({ row, organizationId: context.organizationId }) });
  },
});
