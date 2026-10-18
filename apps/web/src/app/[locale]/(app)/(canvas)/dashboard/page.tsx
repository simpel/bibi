import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { DashboardPage } from "@/features/dashboard/ui/dashboard-page";

type DashboardRouteProps = { params: Promise<{ locale: string }> };

export default async function DashboardRoute({ params }: DashboardRouteProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <DashboardPage />;
}
