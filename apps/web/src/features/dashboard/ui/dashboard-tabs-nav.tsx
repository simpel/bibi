"use client";

import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { periodHref } from "@/features/finance/lib/finance-href";
import type { Period } from "@/features/finance/lib/finance-period";
import { Link } from "@/lib/navigation";
import { type DashboardTab, tabBase } from "../lib/dashboard-tabs";

export type DashboardTabsNavProps = {
  tab: DashboardTab;
  /** The tabs the caller may read, in order. */
  tabs: readonly DashboardTab[];
  period: Period;
};

/** The tabs as links: each keeps the range, so switching tab keeps what is picked (ADR 0086). */
export function DashboardTabsNav({ tab, tabs, period }: DashboardTabsNavProps) {
  const t = useTranslations("dashboard.tabs");
  return (
    <Tabs value={tab}>
      <TabsList aria-label={t("label")}>
        {tabs.map((each) => (
          <TabsTrigger key={each} value={each} asChild>
            <Link href={periodHref({ ...period, base: tabBase({ tab: each }) })}>{t(each)}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
