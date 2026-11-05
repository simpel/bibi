"use client";

import { ViewSwitcher, ViewSwitcherItem } from "@bibi/ui";
import { CalendarClockIcon, LandmarkIcon, TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { type DashboardKey, dashboardBase } from "../lib/dashboards";

const ICONS: Record<DashboardKey, typeof LandmarkIcon> = {
  forecast: TrendingUpIcon,
  financials: LandmarkIcon,
  workload: CalendarClockIcon,
};

export type DashboardsNavProps = {
  dashboard: DashboardKey;
  /** The dashboards the caller may read, in order. */
  dashboards: readonly DashboardKey[];
};

/** The dashboards as a prominent switcher in the header. */
export function DashboardsNav({ dashboard, dashboards }: DashboardsNavProps) {
  const t = useTranslations("dashboard.tabs");
  return (
    <ViewSwitcher aria-label={t("label")}>
      {dashboards.map((each) => {
        const Icon = ICONS[each];
        const base = dashboardBase({ dashboard: each });
        // Switching between views goes to each dashboard's default URL route
        return (
          <ViewSwitcherItem
            key={each}
            asChild
            active={each === dashboard}
            icon={<Icon aria-hidden />}
            label={t(each)}
            description={t(`descriptions.${each}`)}
          >
            <Link href={base} />
          </ViewSwitcherItem>
        );
      })}
    </ViewSwitcher>
  );
}
