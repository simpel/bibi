import { getPaymentSettings } from "../../features/payment-account/settings-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoPaymentSettingsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0090, 0100: the organization's settings read back as seeded (the deposit rule and one route
 * per method); an organization without `paymentSettings` has none. Returns failure messages.
 */
export async function checkDemoPaymentSettings({ context, org }: CheckDemoPaymentSettingsInput) {
  const read = await execute({ operation: getPaymentSettings, input: {}, context });
  if (!read.ok) return [`${org.slug}: could not read payment settings`];
  const { id, depositPercent, depositMinimumMinor, routes } = read.value;
  const wanted = org.paymentSettings;
  if (!wanted) {
    return id === null ? [] : [`${org.slug}: payment settings saved, expected none`];
  }
  const failures: string[] = [];
  if (depositPercent !== (wanted.depositPercent ?? null)) {
    failures.push(
      `${org.slug}: deposit percent ${depositPercent}, expected ${wanted.depositPercent}`,
    );
  }
  if (depositMinimumMinor !== (wanted.depositMinimumMinor ?? null)) {
    failures.push(`${org.slug}: deposit minimum ${depositMinimumMinor}`);
  }
  for (const route of routes) {
    const expected = wanted.routes.find((r) => r.method === route.method)?.provider ?? null;
    if (route.provider !== expected) {
      failures.push(
        `${org.slug}: ${route.method} routed to ${route.provider}, expected ${expected}`,
      );
    }
  }
  return failures;
}
