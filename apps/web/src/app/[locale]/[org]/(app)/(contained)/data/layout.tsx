import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { DashboardsShell } from "@/features/dashboard/ui/dashboards-shell";

type DashboardsLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Above the dashboard and range segments, so the header stays while the content changes. */
export default async function DashboardsLayout({ children, params }: DashboardsLayoutProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <DashboardsShell>{children}</DashboardsShell>;
}
