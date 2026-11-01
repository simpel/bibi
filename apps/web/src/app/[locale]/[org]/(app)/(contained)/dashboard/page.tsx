import { resolveLocale } from "@bibi/i18n";
import { defaultDashboardTab, defaultTabHref } from "@/features/dashboard/dashboard-path";
import { redirect } from "@/lib/navigation";

type DashboardStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/dashboard`: the first tab the caller may read, on this month (ADR 0086). */
export default async function DashboardStart({ params }: DashboardStartProps) {
  const { locale, org } = await params;
  const href = await defaultTabHref({ tab: await defaultDashboardTab() });
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
