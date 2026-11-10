import type { ProviderConnection } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { HostedOnboardingPort } from "../../providers/connect-types";
import type { ProviderKey } from "../../providers/provider-keys";
import { providersWith } from "../../providers/registry";

export type AccountProvider = { key: ProviderKey; port: HostedOnboardingPort };

/**
 * The provider behind the payout account (ADR 0028, 0100): the one that onboards accounts on its
 * own hosted pages. `paymentAccount.*` keeps its names until connecting moves under `integration`.
 */
export function accountProvider(): Result<AccountProvider> {
  const [adapter] = providersWith({ capability: "HOSTED_ONBOARDING" });
  if (adapter?.connect.kind !== "HOSTED_ONBOARDING") {
    const message = "No payment operator with hosted onboarding is available";
    return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
  }
  return ok({ value: { key: adapter.key, port: adapter.connect } });
}

export type LoadAccountInput = { context: Pick<OperationContext, "db"> };

/** The organization's payout account row, or null before onboarding started. */
export async function loadAccountRow({
  context,
}: LoadAccountInput): Promise<ProviderConnection | null> {
  const provider = accountProvider();
  if (!provider.ok) return null;
  return context.db.providerConnection.findFirst({ where: { provider: provider.value.key } });
}
