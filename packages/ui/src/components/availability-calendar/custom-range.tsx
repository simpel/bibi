"use client";

import { calendarLocales } from "../calendar/calendar";
import { DateRangePanel } from "../date-picker/date-range-panel";
import { PopoverContent } from "../popover/popover";
import { useCalendarLabels } from "./calendar-labels";
import { dateOfDay, dayOfDate, rangePresets } from "./calendar-presets";

export type CustomRangeProps = {
  /** The days on screen now: the calendar opens on them. */
  from: string;
  to: string;
  today: string;
  locale: string;
  /** Fits the range into the track; `to` is inclusive. */
  onApply: (range: { from: string; to: string }) => void;
};

/** Presets and a calendar: the first day clicked starts a span, the second finishes it. */
export function CustomRange({ from, to, today, locale, onApply }: CustomRangeProps) {
  const labels = useCalendarLabels();
  return (
    <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-2">
      <DateRangePanel
        range={{ from: dateOfDay({ day: from }), to: dateOfDay({ day: to }) }}
        presets={rangePresets({ today, labels: labels.rangePresets })}
        calendar={{
          locale: locale.startsWith("sv") ? calendarLocales.sv : calendarLocales.en,
          weekStartsOn: 1,
          timeZone: "UTC",
        }}
        onPick={({ from: start, to: end }) =>
          start &&
          end &&
          onApply({ from: dayOfDate({ date: start }), to: dayOfDate({ date: end }) })
        }
      />
    </PopoverContent>
  );
}
