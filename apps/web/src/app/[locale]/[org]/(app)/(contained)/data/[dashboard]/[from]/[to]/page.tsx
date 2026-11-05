import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import {
  defaultDashboard,
  defaultDashboardHref,
  resetDashboardHref,
} from "@/features/dashboard/dashboard-path";
import { dashboardOf } from "@/features/dashboard/lib/dashboards";
import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";
import { PeriodResetToast } from "@/features/dashboard/ui/period-reset-toast";
import { financeToday } from "@/features/finance/finance-path";
import {
  isForwardPeriod,
  isHistoricalPeriod,
  isValidPeriod,
} from "@/features/finance/lib/finance-period";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";

type DashboardRouteProps = {
  params: Promise<{ locale: string; org: string; dashboard: string; from: string; to: string }>;
  searchParams: Promise<{ customer?: string | string[]; reset?: string }>;
};

export async function generateMetadata({ params }: DashboardRouteProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "dashboard" });
}

/** One dashboard for `{from}` to `{to}`, inclusive, at most 24 months. */
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
  }

  const period = { from, to };
  const today = await financeToday();

  // Validate period validity and time direction
  if (!isValidPeriod(period)) {
    redirect({ href: await defaultDashboardHref({ dashboard }), locale, org });
  }

  if (dashboard === "forecast" && !isForwardPeriod({ period, today })) {
    const resetHref = await resetDashboardHref({ dashboard });
    redirect({ href: `${resetHref}?reset=forwardOnly`, locale, org });
  }

  if (dashboard !== "forecast" && !isHistoricalPeriod({ period, today })) {
    const resetHref = await resetDashboardHref({ dashboard });
    redirect({ href: `${resetHref}?reset=historicalOnly`, locale, org });
  }

  const customerId = typeof customer === "string" && customer !== "" ? customer : undefined;
  return (
    <>
      <PeriodResetToast />
      <DashboardPage {...{ locale, org, dashboard, customerId }} period={period} />
    </>
  );
}
