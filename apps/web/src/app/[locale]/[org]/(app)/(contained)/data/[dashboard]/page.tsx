import { resolveLocale } from "@bibi/i18n";
import { defaultDashboard, defaultDashboardHref } from "@/features/dashboard/dashboard-path";
import { dashboardOf } from "@/features/dashboard/lib/dashboards";
import { redirect } from "@/lib/navigation";

type DashboardStartProps = { params: Promise<{ locale: string; org: string; dashboard: string }> };

/** `/data/{dashboard}` without a range: this month; an unknown one goes to the default. */
export default async function DashboardStart({ params }: DashboardStartProps) {
  const { locale, org, dashboard } = await params;
  const known = dashboardOf({ value: dashboard }) ?? (await defaultDashboard());
  const href = await defaultDashboardHref({ dashboard: known });
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
