import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { defaultDashboard, defaultDashboardHref } from "@/features/dashboard/dashboard-path";
import { dashboardOf } from "@/features/dashboard/lib/dashboards";
import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";
import { isValidPeriod } from "@/features/finance/lib/finance-period";
import { redirect } from "@/lib/navigation";

type DashboardRouteProps = {
  params: Promise<{ locale: string; org: string; dashboard: string; from: string; to: string }>;
  searchParams: Promise<{ customer?: string | string[] }>;
};

/** One dashboard for `{from}` to `{to}`, inclusive, at most 24 months (ADR 0086). */
export default async function DashboardRoute({ params, searchParams }: DashboardRouteProps) {
  const { org, from, to, ...rest } = await params;
  const { customer } = await searchParams;
  const locale = resolveLocale({ value: rest.locale });
  setRequestLocale(locale);
  const dashboard = dashboardOf({ value: rest.dashboard });
  if (!dashboard) {
    redirect({
      href: await defaultDashboardHref({ dashboard: await defaultDashboard() }),
      locale,
      org,
    });
  } else if (!isValidPeriod({ from, to })) {
    redirect({ href: await defaultDashboardHref({ dashboard }), locale, org });
  } else {
    const customerId = typeof customer === "string" && customer !== "" ? customer : undefined;
    return <DashboardPage {...{ locale, org, dashboard, customerId }} period={{ from, to }} />;
  }
}
