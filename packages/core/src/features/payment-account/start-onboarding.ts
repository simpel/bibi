import { getEnv } from "@bibi/config";
import { getDb, type PaymentAccount } from "@bibi/db";
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
  if (existing?.disconnectedAt) {
    // Connecting again resumes the same Stripe account (ADR 0090).
    const row = await context.db.paymentAccount.update({
      where: { id: existing.id },
      data: { disconnectedAt: null },
    });
    const { organizationId } = context;
    const before = toPaymentAccountDto({ row: existing, organizationId });
    context.recordChange({
      entityId: row.id,
      before,
      after: toPaymentAccountDto({ row, organizationId }),
    });
    return row;
  }
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

export type OnboardingReturnUrlsInput = { organizationId: string };

/**
 * Where Stripe sends the venue back; both lead to Settings → Integrations under the
 * organization's slug (ADR 0062). The slug is read outside the org-scoped client.
 */
export async function onboardingReturnUrls({ organizationId }: OnboardingReturnUrlsInput) {
  const organization = await getDb().organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  const slug = encodeURIComponent(organization?.slug ?? "");
  const url = `${getEnv().WEB_URL}/${slug}/settings/integrations`;
  return { returnUrl: url, refreshUrl: url };
}
