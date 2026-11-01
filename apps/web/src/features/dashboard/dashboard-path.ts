import "server-only";
import { defaultFinancePeriod } from "@/features/finance/finance-path";
import { periodHref } from "@/features/finance/lib/finance-href";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { type DashboardTab, tabBase } from "./lib/dashboard-tabs";

/** Financials when the caller may read money, else Workload (ADR 0086). */
export async function defaultDashboardTab(): Promise<DashboardTab> {
  const abilities = await getCallerAbilities();
  return can({ abilities, permission: "finance:read" }) ? "financials" : "workload";
}

/** A tab on its default range, this month. */
export async function defaultTabHref({ tab }: { tab: DashboardTab }): Promise<string> {
  return periodHref({ ...(await defaultFinancePeriod()), base: tabBase({ tab }) });
}
