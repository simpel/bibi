import { getEnv } from "@bibi/config";
import { getDb, type ProviderConnection } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { accountProvider, loadAccountRow } from "./account-provider";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export type EnsureRowInput = { context: OperationContext };

/**
 * The organization's account row, inserted on first use with no Stripe account id yet. Stripe is
 * called afterwards by `onboardAfterCommit`, so the row exists before anything outside does.
 */
export async function ensurePaymentAccountRow({
  context,
}: EnsureRowInput): Promise<Result<ProviderConnection>> {
  const provider = accountProvider();
  if (!provider.ok) return err({ error: provider.error });
  const existing = await loadAccountRow({ context });
  if (existing?.disconnectedAt) {
    // Connecting again resumes the same Stripe account (ADR 0090).
    const row = await context.db.providerConnection.update({
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
    return ok({ value: row });
  }
  if (existing) return ok({ value: existing });
  const row = await context.db.providerConnection.create({
    data: {
      organizationId: context.organizationId,
      provider: provider.value.key,
      status: "ONBOARDING",
      createdBy: context.actor.userId,
    },
  });
  context.recordChange({
    entityId: row.id,
    after: toPaymentAccountDto({ row, organizationId: context.organizationId }),
  });
  return ok({ value: row });
}

export type OnboardingReturnUrlsInput = { organizationId: string };

/**
 * Where Stripe sends the venue back; both lead to Administration → Integrations under the
 * organization's slug (ADR 0062). The slug is read outside the org-scoped client.
 */
export async function onboardingReturnUrls({ organizationId }: OnboardingReturnUrlsInput) {
  const organization = await getDb().organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  const slug = encodeURIComponent(organization?.slug ?? "");
  const url = `${getEnv().WEB_URL}/${slug}/admin/integrations`;
  return { returnUrl: url, refreshUrl: url };
}
