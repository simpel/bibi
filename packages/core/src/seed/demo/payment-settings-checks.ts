import { getPaymentSettings } from "../../features/payment-account/settings-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoPaymentSettingsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0090: the organization's settings read back as seeded (30 / 1 000 000 / STRIPE for
 * Lindholmen); an organization without `paymentSettings` has none. Returns failure messages.
 */
export async function checkDemoPaymentSettings({ context, org }: CheckDemoPaymentSettingsInput) {
  const read = await execute({ operation: getPaymentSettings, input: {}, context });
  if (!read.ok) return [`${org.slug}: could not read payment settings`];
  const { id, depositPercent, depositMinimumMinor, invoiceProvider } = read.value;
  const wanted = org.paymentSettings;
  if (!wanted) {
    return id === null ? [] : [`${org.slug}: payment settings saved, expected none`];
  }
  const same =
    depositPercent === wanted.depositPercent &&
    depositMinimumMinor === wanted.depositMinimumMinor &&
    invoiceProvider === wanted.invoiceProvider;
  if (same) return [];
  const actual = `${depositPercent} / ${depositMinimumMinor} / ${invoiceProvider}`;
  const expected = `${wanted.depositPercent} / ${wanted.depositMinimumMinor} / ${wanted.invoiceProvider}`;
  return [`${org.slug}: payment settings ${actual}, expected ${expected}`];
}
