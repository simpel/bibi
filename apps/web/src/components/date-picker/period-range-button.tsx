"use client";

import { type PlainDate, toIsoDate } from "@bibi/core/schemas";
import { type DateRange, DateRangeButton, toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Period } from "@/features/finance/lib/finance-period";
import { dateOfDay, dayOfDate, periodOfRange, rangeOfPeriod } from "@/lib/time/period-dates";
import {
  FORWARD_PERIOD_PRESETS,
  HISTORICAL_PERIOD_PRESETS,
  PERIOD_PRESETS,
  type PeriodPreset,
  presetPeriod,
} from "@/lib/time/period-presets";
import { useDatePicker } from "./use-date-picker";

export type PeriodRangeButtonProps = {
  /** The span now; `undefined` shows the placeholder. */
  period: Period | undefined;
  onChange: (period: Period) => void;
  today: PlainDate;
  /** A reason to refuse a span, e.g. too long; the span is then not applied. */
  validate?: (period: Period) => string | undefined;
  /** Restricts presets to historical only or forward only. Defaults to all presets. */
  direction?: "historical" | "forward" | "all";
  id?: string;
};

/** A date range as one button: the span in the user's date format, presets and a calendar inside. */
export function PeriodRangeButton({
  period,
  onChange,
  today,
  validate,
  direction = "all",
  id,
}: PeriodRangeButtonProps) {
  const { t, formatSpan, calendar } = useDatePicker();
  const tCommon = useTranslations("common");
  const tFinance = useTranslations("finance.period");

  const todayIso = toIsoDate({ date: today });
  const todayDate = dateOfDay({ day: todayIso });

  const clampDate = ({ day }: { day: Date }): Date => {
    const clickedIso = dayOfDate({ date: day });
    if (direction === "forward" && clickedIso < todayIso) {
      toast.warning(tFinance("forwardOnly"));
      return todayDate ?? day;
    }
    if (direction === "historical" && clickedIso > todayIso) {
      toast.warning(tFinance("historicalOnly"));
      return todayDate ?? day;
    }
    return day;
  };

  const presetsList: readonly PeriodPreset[] =
    direction === "historical"
      ? HISTORICAL_PERIOD_PRESETS
      : direction === "forward"
        ? FORWARD_PERIOD_PRESETS
        : PERIOD_PRESETS;
  const presets = presetsList.map((preset) => ({
    key: preset.key,
    label: t(`presets.${preset.key}`),
    range: rangeOfPeriod({ period: presetPeriod({ today, preset }) }),
  }));
  return (
    <DateRangeButton
      id={id}
      range={period ? rangeOfPeriod({ period }) : undefined}
      presets={presets}
      label={period ? formatSpan(period) : ""}
      placeholder={t("rangePlaceholder")}
      confirmLabel={tCommon("confirm")}
      calendar={calendar}
      clampDate={clampDate}
      validate={validate && ((range: DateRange) => validate(periodOfRange({ range })))}
      onChange={(range) => onChange(periodOfRange({ range }))}
    />
  );
}
