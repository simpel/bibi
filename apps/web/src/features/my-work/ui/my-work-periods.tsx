"use client";

import { ViewSwitcher, ViewSwitcherItem } from "@bibi/ui";
import { CalendarDaysIcon, CalendarIcon, CalendarRangeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { MyWorkPeriod, MyWorkPeriodKey } from "../lib/my-work-periods";

const ICONS: Record<MyWorkPeriodKey, typeof CalendarIcon> = {
  today: CalendarIcon,
  tomorrow: CalendarDaysIcon,
  week: CalendarRangeIcon,
};

export type MyWorkPeriodsProps = {
  periods: readonly MyWorkPeriod[];
  active: MyWorkPeriodKey | null;
};

/** Today, tomorrow or this week: every section of the page follows it (ADR 0110). */
export function MyWorkPeriods({ periods, active }: MyWorkPeriodsProps) {
  const t = useTranslations("myWork.periods");
  return (
    <ViewSwitcher aria-label={t("label")}>
      {periods.map((period) => {
        const Icon = ICONS[period.key];
        return (
          <ViewSwitcherItem
            key={period.key}
            asChild
            active={period.key === active}
            icon={<Icon aria-hidden />}
            label={t(period.key)}
          >
            <Link href={period.href} />
          </ViewSwitcherItem>
        );
      })}
    </ViewSwitcher>
  );
}
