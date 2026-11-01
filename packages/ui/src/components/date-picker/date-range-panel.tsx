"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "../button/button";
import { Calendar, type CalendarProps } from "../calendar/calendar";

export type DateRangePreset = { key: string; label: string; range: DateRange };

export type DateRangePanelProps = {
  range: DateRange | undefined;
  presets: readonly DateRangePreset[];
  /** Called with the finished range: a preset, or the second day clicked. */
  onPick: (range: DateRange) => void;
  /** A reason to refuse a range, shown under the calendar; the range is then not applied. */
  validate?: (range: DateRange) => string | undefined;
  calendar?: Pick<CalendarProps, "locale" | "weekStartsOn" | "disabled" | "timeZone">;
};

type PresetListProps = Pick<DateRangePanelProps, "presets"> & {
  onPreset: (range: DateRange) => void;
};

function PresetList({ presets, onPreset }: PresetListProps) {
  return (
    <div className="flex flex-wrap gap-1 sm:w-32 sm:flex-col">
      {presets.map((preset) => (
        <Button
          key={preset.key}
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => onPreset(preset.range)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

/** Presets beside two months: the first click starts a span, the second finishes it. */
export function DateRangePanel({
  range,
  presets,
  onPick,
  validate,
  calendar,
}: DateRangePanelProps) {
  const [start, setStart] = useState<Date | undefined>();
  const [error, setError] = useState<string | undefined>();
  const finish = ({ next }: { next: DateRange }) => {
    const message = validate?.(next);
    setError(message);
    if (!message) onPick(next);
  };
  const click = ({ day }: { day: Date }) => {
    if (!start) return setStart(day);
    setStart(undefined);
    finish({ next: day < start ? { from: day, to: start } : { from: start, to: day } });
  };
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <PresetList presets={presets} onPreset={(next) => finish({ next })} />
      <div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={range?.from}
          selected={start ? { from: start, to: undefined } : range}
          onDayClick={(day) => click({ day })}
          {...calendar}
        />
        {error ? <p className="px-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
