import { getEnv } from "@okazi/config";
import { getDb } from "@okazi/db";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { getStripeConnectGateway } from "./gateway-registry";
import type { PaymentAccountStartOnboardingInput } from "./schema";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export type EnsureAccountInput = {
  input: PaymentAccountStartOnboardingInput;
  context: OperationContext;
};

/** The stored account row, created at Stripe and in the database on first use. */
export async function ensurePaymentAccount({
  input,
  context,
}: EnsureAccountInput): Promise<Result<{ stripeAccountId: string; rowId: string }>> {
  const existing = await context.db.paymentAccount.findFirst({});
  if (existing)
    return ok({ value: { stripeAccountId: existing.stripeAccountId, rowId: existing.id } });
  const organization = await getDb().organization.findUnique({
    where: { id: context.organizationId },
    select: { name: true },
  });
  const created = await getStripeConnectGateway().createAccount({
    organizationId: context.organizationId,
    displayName: organization?.name ?? context.organizationId,
    country: input.country,
    contactEmail: input.contactEmail,
  });
  if (!created.ok) return err({ error: created.error });
  const row = await context.db.paymentAccount.create({
    data: {
      organizationId: context.organizationId,
      stripeAccountId: created.value.stripeAccountId,
      createdBy: context.actor.userId,
    },
  });
  context.recordChange({
    entityId: row.id,
    after: toPaymentAccountDto({ row, organizationId: context.organizationId }),
  });
  return ok({ value: { stripeAccountId: row.stripeAccountId, rowId: row.id } });
}

/** Where Stripe sends the venue back; both lead to the payments settings page. */
export function onboardingReturnUrls() {
  const url = `${getEnv().WEB_URL}/settings/payments`;
  return { returnUrl: url, refreshUrl: url };
}
