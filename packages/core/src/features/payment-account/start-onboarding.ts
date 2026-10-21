import { getEnv } from "@okazi/config";
import type { PaymentAccount } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export type EnsureRowInput = { context: OperationContext };

/**
 * The organization's account row, inserted on first use with no Stripe account id yet. Stripe is
 * called afterwards by `onboardAfterCommit`, so the row exists before anything outside does.
 */
export async function ensurePaymentAccountRow({
  context,
}: EnsureRowInput): Promise<PaymentAccount> {
  const existing = await context.db.paymentAccount.findFirst({});
  if (existing) return existing;
  const row = await context.db.paymentAccount.create({
    data: { organizationId: context.organizationId, createdBy: context.actor.userId },
  });
  context.recordChange({
    entityId: row.id,
    after: toPaymentAccountDto({ row, organizationId: context.organizationId }),
  });
  return row;
}

/** Where Stripe sends the venue back; both lead to the payments settings page. */
export function onboardingReturnUrls() {
  const url = `${getEnv().WEB_URL}/settings/payments`;
  return { returnUrl: url, refreshUrl: url };
}
