import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { defaultDashboard, defaultDashboardHref } from "@/features/dashboard/dashboard-path";
import { dashboardOf } from "@/features/dashboard/lib/dashboards";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";

type DashboardStartProps = {
  params: Promise<{ locale: string; org: string; dashboard: string }>;
  searchParams: Promise<{ customer?: string | string[] }>;
};

export async function generateMetadata({ params }: DashboardStartProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "dashboard" });
}

/** `/data/{dashboard}` without a range: server-side redirects to default period. */
export default async function DashboardStart({ params, searchParams }: DashboardStartProps) {
  const { locale: localeParam, org, dashboard: dashboardParam } = await params;
  const { customer } = await searchParams;
  const locale = resolveLocale({ value: localeParam });
  setRequestLocale(locale);

  const dashboard = dashboardOf({ value: dashboardParam }) ?? (await defaultDashboard());
  const href = await defaultDashboardHref({ dashboard });
  const search =
    typeof customer === "string" && customer !== ""
      ? `?customer=${encodeURIComponent(customer)}`
      : "";
  redirect({ href: `${href}${search}`, locale, org });
}
