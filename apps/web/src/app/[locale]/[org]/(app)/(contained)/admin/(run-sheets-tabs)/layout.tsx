import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminTabLayout } from "@/components/admin/admin-tab-layout";

type LayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Above the page's tabs, so its title and tabs stay while the tab changes. */
export default async function RunSheetsTabsLayout({ children, params }: LayoutProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <AdminTabLayout page="runSheets">{children}</AdminTabLayout>;
}
