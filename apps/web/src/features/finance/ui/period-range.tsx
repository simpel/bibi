"use client";

import type { PlainDate } from "@bibi/core/schemas";
import { useRouter } from "@/lib/navigation";
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
  const router = useRouter();
  return (
    <FinancePeriodButton
      period={period}
      today={today}
      onChange={(next) => router.push(periodHref({ ...next, base, customerId }))}
    />
  );
}
