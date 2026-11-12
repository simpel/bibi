import { getDb, type ProviderConnection } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import type { HostedOnboardingPort } from "../../providers/connect-types";
import { notFound } from "../../shared/errors";
import { accountProvider, loadAccountRow } from "./account-provider";
import type { PaymentAccountOnboardingDto, PaymentAccountStartOnboardingInput } from "./schema";
import { onboardingReturnUrls } from "./start-onboarding";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export type OnboardAfterCommitInput = ExternalInput<
  PaymentAccountStartOnboardingInput,
  PaymentAccountOnboardingDto
>;

type CreateInput = Pick<OnboardAfterCommitInput, "input" | "context"> & {
  gateway: HostedOnboardingPort;
  row: ProviderConnection;
  /** Set when the stored account is gone at the provider and this one takes its place. */
  replaces?: string;
};

/** The organization's name for the connected account, read outside the org-scoped client. */
async function displayNameOf({ organizationId }: { organizationId: string }) {
  const organization = await getDb().organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });
  return organization?.name ?? organizationId;
}

/** Creates the connected account and stores its id on the row (audited). */
async function createAccount({
  input,
  context,
  gateway,
  row,
  replaces,
}: CreateInput): Promise<Result<ProviderConnection>> {
  const { organizationId } = context;
  const created = await gateway.createAccount({
    organizationId,
    displayName: await displayNameOf({ organizationId }),
    country: input.country,
    contactEmail: input.contactEmail,
    replaces,
  });
  if (!created.ok) return err({ error: created.error });
  const updated = await context.db.providerConnection.update({
    where: { id: row.id },
    data: { externalAccountId: created.value.externalAccountId },
  });
  context.recordChange({
    entityId: row.id,
    before: toPaymentAccountDto({ row, organizationId }),
    after: toPaymentAccountDto({ row: updated, organizationId }),
  });
  return ok({ value: updated });
}

/**
 * `paymentAccount.startOnboarding`'s calls to Stripe, run by `execute` once the row is committed
 * and never by a change preview (ADR 0058). The connected account is created only while the row
 * has no account id, with an idempotency key derived from the organization (one row each); a call
 * after a refused one resumes the row. Connecting again resumes the stored account (ADR 0090),
 * unless the provider no longer knows it (closed, unlinked, or a demo seed's fake id): then a fresh
 * account replaces it. The link is always fresh.
 */
export async function onboardAfterCommit({
  input,
  context,
}: OnboardAfterCommitInput): Promise<Result<PaymentAccountOnboardingDto>> {
  let row = await loadAccountRow({ context });
  if (!row) return notFound({ entity: "Payment account" });
  const provider = accountProvider();
  if (!provider.ok) return provider;
  const gateway = provider.value.port;
  const urls = await onboardingReturnUrls({ organizationId: context.organizationId });
  const linkFor = ({ account }: { account: ProviderConnection }) =>
    gateway.onboardingLink({ externalAccountId: account.externalAccountId ?? "", ...urls });
  const resumed = row.externalAccountId;
  if (!resumed) {
    const created = await createAccount({ input, context, gateway, row });
    if (!created.ok) return created;
    row = created.value;
  }
  let link = await linkFor({ account: row });
  if (!link.ok && link.error.code === "NOT_FOUND" && resumed) {
    getLogger().warn({ event: "paymentAccount.accountReplaced", connectionId: row.id });
    const created = await createAccount({ input, context, gateway, row, replaces: resumed });
    if (!created.ok) return created;
    row = created.value;
    link = await linkFor({ account: row });
  }
  if (!link.ok) return err({ error: link.error });
  const dto = toPaymentAccountDto({ row, organizationId: context.organizationId });
  return ok({
    value: { ...dto, onboardingUrl: link.value.url, onboardingExpiresAt: link.value.expiresAt },
  });
}
