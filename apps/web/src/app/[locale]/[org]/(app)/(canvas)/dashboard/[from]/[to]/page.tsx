import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { defaultDashboardPeriod } from "@/features/dashboard/dashboard-path";
import { dashboardHref } from "@/features/dashboard/lib/dashboard-href";
import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";
import { isValidPeriod } from "@/features/finance/lib/finance-period";
import { redirect } from "@/lib/navigation";

type DashboardRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
};

/** The dashboard for `{from}` to `{to}`, inclusive, at most 24 months (ADR 0079). */
export default async function DashboardRoute({ params }: DashboardRouteProps) {
  const { org, from, to, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  setRequestLocale(locale);
  if (!isValidPeriod({ from, to })) {
    redirect({ href: dashboardHref(await defaultDashboardPeriod()), locale, org });
  }
  return <DashboardPage locale={locale} from={from} to={to} />;
}
