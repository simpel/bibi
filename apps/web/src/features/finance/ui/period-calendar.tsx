"use client";

import { Calendar, calendarLocales } from "@bibi/ui";
import { useLocale } from "next-intl";
import { dateOfDay, periodOfRange, rangeOfPeriod } from "@/lib/time/period-dates";
import type { Period } from "../lib/finance-period";

export type PeriodCalendarProps = { draft: Period; onChange: (draft: Period) => void };

/** Picks a period by clicking its first and last day on a two-month calendar. */
export function PeriodCalendar({ draft, onChange }: PeriodCalendarProps) {
  const locale = useLocale();
  return (
    <div className="flex justify-center">
      <Calendar
        mode="range"
        numberOfMonths={2}
        weekStartsOn={1}
        locale={locale === "sv" ? calendarLocales.sv : calendarLocales.en}
        defaultMonth={dateOfDay({ day: draft.from })}
        selected={rangeOfPeriod({ period: draft })}
        onSelect={(range) => onChange(periodOfRange({ range }))}
      />
    </div>
  );
}
