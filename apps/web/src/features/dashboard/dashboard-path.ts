import "server-only";
import {
  defaultFinancePeriod,
  defaultForecastPeriod,
  defaultHistoricalResetPeriod,
} from "@/features/finance/finance-path";
import { periodHref } from "@/features/finance/lib/finance-href";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { DASHBOARDS, type DashboardKey, dashboardBase } from "./lib/dashboards";

export { defaultFinancePeriod, defaultForecastPeriod };

/** The dashboards the caller may read: Forecast and Financials need `finance:read`. */
export async function visibleDashboards(): Promise<DashboardKey[]> {
  const abilities = await getCallerAbilities();
  const hasFinance = can({ abilities, permission: "finance:read" });
  return DASHBOARDS.filter(
    (dashboard) => (dashboard !== "financials" && dashboard !== "forecast") || hasFinance,
  );
}

/** The first dashboard the caller may read: Forecast if permitted, else Workload. */
export async function defaultDashboard(): Promise<DashboardKey> {
  return (await visibleDashboards())[0] ?? "workload";
}

/** A dashboard on its default range (Forecast defaults to next 30 days, others to this month). */
export async function defaultDashboardHref({
  dashboard,
}: {
  dashboard: DashboardKey;
}): Promise<string> {
  const period =
    dashboard === "forecast" ? await defaultForecastPeriod() : await defaultFinancePeriod();
  return periodHref({ ...period, base: dashboardBase({ dashboard }) });
}

/** A dashboard on its 30-day reset range when an invalid direction is navigated to. */
export async function resetDashboardHref({
  dashboard,
}: {
  dashboard: DashboardKey;
}): Promise<string> {
  const period =
    dashboard === "forecast" ? await defaultForecastPeriod() : await defaultHistoricalResetPeriod();
  return periodHref({ ...period, base: dashboardBase({ dashboard }) });
}
