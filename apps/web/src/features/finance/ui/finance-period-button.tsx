"use client";

import type { PlainDate } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PeriodRangeButton } from "@/components/date-picker/period-range-button";
import { isValidPeriod, MAX_PERIOD_MONTHS, type Period } from "../lib/finance-period";

export type FinancePeriodButtonProps = {
  period: Period;
  today: PlainDate;
  onChange: (period: Period) => void;
};

/** The period picker with finance's limit: two days in order, at most `MAX_PERIOD_MONTHS` apart. */
export function FinancePeriodButton({ period, today, onChange }: FinancePeriodButtonProps) {
  const t = useTranslations("finance.period");
  return (
    <PeriodRangeButton
      period={period}
      today={today}
      validate={(next) =>
        isValidPeriod(next) ? undefined : t("invalid", { months: MAX_PERIOD_MONTHS })
      }
      onChange={onChange}
    />
  );
}
