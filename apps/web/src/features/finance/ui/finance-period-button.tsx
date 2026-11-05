"use client";

import type { PlainDate } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PeriodRangeButton } from "@/components/date-picker/period-range-button";
import {
  isForwardPeriod,
  isHistoricalPeriod,
  isValidPeriod,
  MAX_PERIOD_MONTHS,
  type Period,
} from "../lib/finance-period";

export type FinancePeriodButtonProps = {
  period: Period;
  today: PlainDate;
  onChange: (period: Period) => void;
  direction?: "historical" | "forward" | "all";
};

/** The period picker with direction checks: historical only, forward only, or all. */
export function FinancePeriodButton({
  period,
  today,
  onChange,
  direction = "all",
}: FinancePeriodButtonProps) {
  const t = useTranslations("finance.period");
  const validate = ({ from, to }: Period) => {
    const next: Period = { from, to };
    if (!isValidPeriod(next)) return t("invalid", { months: MAX_PERIOD_MONTHS });
    if (direction === "historical" && !isHistoricalPeriod({ period: next, today })) {
      return t("historicalOnly");
    }
    if (direction === "forward" && !isForwardPeriod({ period: next, today })) {
      return t("forwardOnly");
    }
    return undefined;
  };
  return (
    <PeriodRangeButton
      period={period}
      today={today}
      direction={direction}
      validate={validate}
      onChange={onChange}
    />
  );
}
