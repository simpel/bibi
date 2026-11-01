"use client";

import { DateButton, type DateButtonProps } from "@bibi/ui";
import { dateOfDay, dayOfDate } from "@/lib/time/period-dates";
import { useDatePicker } from "./use-date-picker";

export type PlainDateButtonProps = Omit<
  DateButtonProps,
  "value" | "onChange" | "label" | "placeholder" | "calendar" | "clearLabel"
> & {
  /** A plain date, `YYYY-MM-DD`; empty is no date. */
  value: string;
  onChange: (value: string) => void;
  /** An optional date can be cleared. */
  clearable?: boolean;
};

/** One plain date as a button in the user's date format that opens a calendar. */
export function PlainDateButton({ value, onChange, clearable, ...aria }: PlainDateButtonProps) {
  const { t, formatDay, calendar } = useDatePicker();
  return (
    <DateButton
      {...aria}
      value={dateOfDay({ day: value })}
      onChange={(date) => onChange(date ? dayOfDate({ date }) : "")}
      label={formatDay({ day: value })}
      placeholder={t("placeholder")}
      clearLabel={clearable ? t("clear") : undefined}
      calendar={calendar}
    />
  );
}
