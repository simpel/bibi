"use client";

import type { PlainDate } from "@bibi/core/schemas";
import { type DateRange, DateRangeButton } from "@bibi/ui";
import type { Period } from "@/features/finance/lib/finance-period";
import { periodOfRange, rangeOfPeriod } from "@/lib/time/period-dates";
import { PERIOD_PRESETS, presetPeriod } from "@/lib/time/period-presets";
import { useDatePicker } from "./use-date-picker";

export type PeriodRangeButtonProps = {
  /** The span now; `undefined` shows the placeholder. */
  period: Period | undefined;
  onChange: (period: Period) => void;
  today: PlainDate;
  /** A reason to refuse a span, e.g. too long; the span is then not applied. */
  validate?: (period: Period) => string | undefined;
  id?: string;
};

/** A date range as one button: the span in the user's date format, presets and a calendar inside. */
export function PeriodRangeButton({
  period,
  onChange,
  today,
  validate,
  id,
}: PeriodRangeButtonProps) {
  const { t, formatSpan, calendar } = useDatePicker();
  const presets = PERIOD_PRESETS.map((preset) => ({
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
      calendar={calendar}
      validate={validate && ((range: DateRange) => validate(periodOfRange({ range })))}
      onChange={(range) => onChange(periodOfRange({ range }))}
    />
  );
}
