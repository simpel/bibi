import { resolveLocale } from "@bibi/i18n";
import { defaultDashboardTab, defaultTabHref } from "@/features/dashboard/dashboard-path";
import { dashboardTabOf } from "@/features/dashboard/lib/dashboard-tabs";
import { redirect } from "@/lib/navigation";

type DashboardTabStartProps = { params: Promise<{ locale: string; org: string; tab: string }> };

/** `/dashboard/{tab}` without a range: this month; an unknown tab goes to the default one. */
export default async function DashboardTabStart({ params }: DashboardTabStartProps) {
  const { locale, org, tab } = await params;
  const known = dashboardTabOf({ value: tab }) ?? (await defaultDashboardTab());
  redirect({
    href: await defaultTabHref({ tab: known }),
    locale: resolveLocale({ value: locale }),
    org,
  });
}
