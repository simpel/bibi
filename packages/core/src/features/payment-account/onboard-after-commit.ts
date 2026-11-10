import { getDb } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { accountProvider, loadAccountRow } from "./account-provider";
import type { PaymentAccountOnboardingDto, PaymentAccountStartOnboardingInput } from "./schema";
import { onboardingReturnUrls } from "./start-onboarding";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export type OnboardAfterCommitInput = ExternalInput<
  PaymentAccountStartOnboardingInput,
  PaymentAccountOnboardingDto
>;

/** The organization's name for the connected account, read outside the org-scoped client. */
async function displayNameOf({ organizationId }: { organizationId: string }) {
  const organization = await getDb().organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });
  return organization?.name ?? organizationId;
}

/**
 * `paymentAccount.startOnboarding`'s calls to Stripe, run by `execute` once the row is committed
 * and never by a change preview (ADR 0058). The connected account is created only while the row
 * has no account id, with an idempotency key derived from the organization (one row each); a call
 * after a refused one resumes the row. The link is always fresh.
 */
export async function onboardAfterCommit({
  input,
  context,
}: OnboardAfterCommitInput): Promise<Result<PaymentAccountOnboardingDto>> {
  const before = await loadAccountRow({ context });
  if (!before) return notFound({ entity: "Payment account" });
  const provider = accountProvider();
  if (!provider.ok) return provider;
  const gateway = provider.value.port;
  let row = before;
  if (!row.externalAccountId) {
    const created = await gateway.createAccount({
      organizationId: context.organizationId,
      displayName: await displayNameOf({ organizationId: context.organizationId }),
      country: input.country,
      contactEmail: input.contactEmail,
    });
    if (!created.ok) return err({ error: created.error });
    row = await context.db.providerConnection.update({
      where: { id: row.id },
      data: { externalAccountId: created.value.externalAccountId },
    });
    const { organizationId } = context;
    context.recordChange({
      entityId: row.id,
      before: toPaymentAccountDto({ row: before, organizationId }),
      after: toPaymentAccountDto({ row, organizationId }),
    });
  }
  const link = await gateway.onboardingLink({
    externalAccountId: row.externalAccountId ?? "",
    ...(await onboardingReturnUrls({ organizationId: context.organizationId })),
  });
  if (!link.ok) return err({ error: link.error });
  const dto = toPaymentAccountDto({ row, organizationId: context.organizationId });
  return ok({
    value: { ...dto, onboardingUrl: link.value.url, onboardingExpiresAt: link.value.expiresAt },
  });
}
