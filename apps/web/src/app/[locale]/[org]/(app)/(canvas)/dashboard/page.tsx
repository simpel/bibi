import { resolveLocale } from "@bibi/i18n";
import { defaultDashboardPeriod } from "@/features/dashboard/dashboard-path";
import { dashboardHref } from "@/features/dashboard/lib/dashboard-href";
import { redirect } from "@/lib/navigation";

type DashboardStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/dashboard`: the last 6 whole months, in the organization's zone. */
export default async function DashboardStart({ params }: DashboardStartProps) {
  const { locale, org } = await params;
  redirect({
    href: dashboardHref(await defaultDashboardPeriod()),
    locale: resolveLocale({ value: locale }),
    org,
  });
}
