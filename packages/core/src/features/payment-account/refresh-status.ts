import type { ProviderConnection } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { onboardingPortOf } from "../../providers/registry";
import { toPaymentAccountDto } from "./to-payment-account-dto";

export type RefreshStatusInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "recordChange">;
  before: ProviderConnection;
};

export type RefreshedStatus = { row: ProviderConnection; changed: boolean };

/**
 * Reads the account's status back from the provider and stores it when it changed (ADR 0028):
 * the provider is asked, never an event payload trusted. Before the account exists there is
 * nothing to read.
 */
export async function refreshAccountStatus({
  context,
  before,
}: RefreshStatusInput): Promise<Result<RefreshedStatus>> {
  if (!before.externalAccountId) return ok({ value: { row: before, changed: false } });
  const port = onboardingPortOf({ key: before.provider });
  if (!port.ok) return port;
  const fetched = await port.value.status({ externalAccountId: before.externalAccountId });
  if (!fetched.ok) return err({ error: fetched.error });
  if (fetched.value.status === before.status) return ok({ value: { row: before, changed: false } });
  const row = await context.db.providerConnection.update({
    where: { id: before.id },
    data: { status: fetched.value.status },
  });
  const { organizationId } = context;
  context.recordChange({
    entityId: row.id,
    before: toPaymentAccountDto({ row: before, organizationId }),
    after: toPaymentAccountDto({ row, organizationId }),
  });
  return ok({ value: { row, changed: true } });
}
