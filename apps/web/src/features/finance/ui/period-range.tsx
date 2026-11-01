"use client";

import type { PlainDate } from "@bibi/core/schemas";
import { useDashboardsNavigate } from "@/features/dashboard/ui/dashboards-pending";
import { periodHref } from "../lib/finance-href";
import type { Period } from "../lib/finance-period";
import { FinancePeriodButton } from "./finance-period-button";

export type PeriodRangeProps = {
  period: Period;
  today: PlainDate;
  /** The page whose period is in the path, e.g. `/financials`. */
  base: string;
  customerId?: string | undefined;
};

/** The period as one button: its dates, with presets and a calendar to change it. */
export function PeriodRange({ period, today, base, customerId }: PeriodRangeProps) {
  const { navigate } = useDashboardsNavigate();
  return (
    <FinancePeriodButton
      period={period}
      today={today}
      onChange={(next) => navigate({ href: periodHref({ ...next, base, customerId }) })}
    />
  );
}
