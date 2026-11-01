"use client";

import { ViewSwitcher, ViewSwitcherItem } from "@bibi/ui";
import { CalendarClockIcon, LandmarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { periodHref } from "@/features/finance/lib/finance-href";
import type { Period } from "@/features/finance/lib/finance-period";
import { Link } from "@/lib/navigation";
import { type DashboardKey, dashboardBase } from "../lib/dashboards";
import { useDashboardsNavigate } from "./dashboards-pending";

const ICONS: Record<DashboardKey, typeof LandmarkIcon> = {
  financials: LandmarkIcon,
  workload: CalendarClockIcon,
};

export type DashboardsNavProps = {
  dashboard: DashboardKey;
  /** The dashboards the caller may read, in order. */
  dashboards: readonly DashboardKey[];
  period: Period;
};

/** The dashboards as a prominent switcher in the header; each link keeps the range (ADR 0086). */
export function DashboardsNav({ dashboard, dashboards, period }: DashboardsNavProps) {
  const t = useTranslations("dashboard.tabs");
  const { navigate } = useDashboardsNavigate();
  return (
    <ViewSwitcher aria-label={t("label")}>
      {dashboards.map((each) => {
        const Icon = ICONS[each];
        const href = periodHref({ ...period, base: dashboardBase({ dashboard: each }) });
        return (
          <ViewSwitcherItem
            key={each}
            asChild
            active={each === dashboard}
            icon={<Icon aria-hidden />}
            label={t(each)}
            description={t(`descriptions.${each}`)}
          >
            <Link
              href={href}
              onClick={(event) => {
                // A plain click is a pending transition; a new tab or window stays a link.
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                navigate({ href });
              }}
            />
          </ViewSwitcherItem>
        );
      })}
    </ViewSwitcher>
  );
}
