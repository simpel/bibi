import "server-only";
import { defaultFinancePeriod } from "@/features/finance/finance-path";
import { periodHref } from "@/features/finance/lib/finance-href";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { DASHBOARDS, type DashboardKey, dashboardBase } from "./lib/dashboards";

/** The dashboards the caller may read: Financials needs `finance:read` (ADR 0086). */
export async function visibleDashboards(): Promise<DashboardKey[]> {
  const abilities = await getCallerAbilities();
  return DASHBOARDS.filter(
    (dashboard) => dashboard !== "financials" || can({ abilities, permission: "finance:read" }),
  );
}

/** The first dashboard the caller may read. */
export async function defaultDashboard(): Promise<DashboardKey> {
  return (await visibleDashboards())[0] ?? "workload";
}

/** A dashboard on its default range, this month. */
export async function defaultDashboardHref({
  dashboard,
}: {
  dashboard: DashboardKey;
}): Promise<string> {
  return periodHref({ ...(await defaultFinancePeriod()), base: dashboardBase({ dashboard }) });
}
