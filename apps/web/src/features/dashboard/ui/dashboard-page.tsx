import type { Locale } from "@bibi/i18n";
import { financeToday } from "@/features/finance/finance-path";
import { periodHref } from "@/features/finance/lib/finance-href";
import type { Period } from "@/features/finance/lib/finance-period";
import { FinancialsTab } from "@/features/finance/ui/financials-tab";
import { ForecastTab } from "@/features/forecast/ui/forecast-tab";
import { redirect } from "@/lib/navigation";
import { visibleDashboards } from "../dashboard-path";
import { type DashboardKey, dashboardBase } from "../lib/dashboards";
import { WorkloadTab } from "./workload-tab";

export type DashboardPageProps = {
  locale: Locale;
  /** The organization slug, for the redirect away from a dashboard the caller may not read. */
  org: string;
  dashboard: DashboardKey;
  period: Period;
  customerId: string | undefined;
};

/** `/data/{dashboard}/{from}/{to}`: the open dashboard's content. */
export async function DashboardPage(props: DashboardPageProps) {
  const { locale, org, dashboard, period, customerId } = props;
  const [dashboards, today] = await Promise.all([visibleDashboards(), financeToday()]);
  if (!dashboards.includes(dashboard)) {
    const href = periodHref({ ...period, base: dashboardBase({ dashboard: "workload" }) });
    redirect({ href, locale, org });
  }
  if (dashboard === "forecast") {
    return <ForecastTab locale={locale} period={period} today={today} customerId={customerId} />;
  }
  return dashboard === "financials" ? (
    <FinancialsTab locale={locale} period={period} today={today} customerId={customerId} />
  ) : (
    <WorkloadTab locale={locale} period={period} />
  );
}
