import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { getStripeConnectGateway } from "./gateway-registry";
import { onboardAfterCommit } from "./onboard-after-commit";
import {
  PaymentAccountOnboardingSchema,
  PaymentAccountSchema,
  PaymentAccountStartOnboardingInputSchema,
  PaymentAccountSyncInputSchema,
} from "./schema";
import { ensurePaymentAccountRow } from "./start-onboarding";
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
  handler: async ({ context }) => {
    // The row first, Stripe only after the commit (`external`, ADR 0058): a preview creates nothing.
    const row = await ensurePaymentAccountRow({ context });
    const dto = toPaymentAccountDto({ row, organizationId: context.organizationId });
    return ok({ value: { ...dto, onboardingUrl: null, onboardingExpiresAt: null } });
  },
  external: onboardAfterCommit,
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
  // Stays in the handler (ADR 0058): it only reads from Stripe, has no approval step and creates
  // nothing there, so a rerun is harmless; the status it returns is the status it stored.
  handler: async ({ context }) => {
    const before = await context.db.paymentAccount.findFirst({});
    if (!before) return notFound({ entity: "Payment account" });
    // Onboarding has not reached Stripe yet: nothing to read.
    if (!before.stripeAccountId) {
      return ok({
        value: toPaymentAccountDto({ row: before, organizationId: context.organizationId }),
      });
    }
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
