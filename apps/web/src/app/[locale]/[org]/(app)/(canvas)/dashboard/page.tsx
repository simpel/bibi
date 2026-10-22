import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";

type DashboardRouteProps = { params: Promise<{ locale: string }> };

export default async function DashboardRoute({ params }: DashboardRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <DashboardPage locale={locale} />;
}
