import { ok, type Result } from "../../errors/result";
import { updatePaymentSettings } from "../../features/payment-account/settings-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type SeedDemoPaymentSettingsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0090: the organization's deposit rule and invoice provider, saved as SYSTEM after the
 * payment account is activated (`seedDemoSales`). Organizations without `paymentSettings` keep none.
 */
export async function seedDemoPaymentSettings({
  context,
  org,
}: SeedDemoPaymentSettingsInput): Promise<Result<true>> {
  if (!org.paymentSettings) return ok({ value: true });
  const input = org.paymentSettings;
  const saved = await execute({ operation: updatePaymentSettings, input, context });
  return saved.ok ? ok({ value: true }) : saved;
}
