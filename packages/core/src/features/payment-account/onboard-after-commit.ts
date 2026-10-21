import { getDb } from "@okazi/db";
import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { getStripeConnectGateway } from "./gateway-registry";
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
  const before = await context.db.paymentAccount.findFirst({});
  if (!before) return notFound({ entity: "Payment account" });
  const gateway = getStripeConnectGateway();
  let row = before;
  if (!row.stripeAccountId) {
    const created = await gateway.createAccount({
      organizationId: context.organizationId,
      displayName: await displayNameOf({ organizationId: context.organizationId }),
      country: input.country,
      contactEmail: input.contactEmail,
    });
    if (!created.ok) return err({ error: created.error });
    row = await context.db.paymentAccount.update({
      where: { id: row.id },
      data: { stripeAccountId: created.value.stripeAccountId },
    });
    const { organizationId } = context;
    context.recordChange({
      entityId: row.id,
      before: toPaymentAccountDto({ row: before, organizationId }),
      after: toPaymentAccountDto({ row, organizationId }),
    });
  }
  const link = await gateway.createOnboardingLink({
    stripeAccountId: row.stripeAccountId ?? "",
    ...onboardingReturnUrls(),
  });
  if (!link.ok) return err({ error: link.error });
  const dto = toPaymentAccountDto({ row, organizationId: context.organizationId });
  return ok({
    value: { ...dto, onboardingUrl: link.value.url, onboardingExpiresAt: link.value.expiresAt },
  });
}
