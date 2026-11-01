import { resolveLocale } from "@bibi/i18n";
import { defaultDashboard, defaultDashboardHref } from "@/features/dashboard/dashboard-path";
import { redirect } from "@/lib/navigation";

type DashboardsStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/data`: the first dashboard the caller may read, on this month (ADR 0086). */
export default async function DashboardsStart({ params }: DashboardsStartProps) {
  const { locale, org } = await params;
  const href = await defaultDashboardHref({ dashboard: await defaultDashboard() });
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
