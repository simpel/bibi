"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "../button/button";
import { Calendar, type CalendarProps } from "../calendar/calendar";

export type DateRangePreset = { key: string; label: string; range: DateRange };

export type DateRangePanelProps = {
  range: DateRange | undefined;
  presets: readonly DateRangePreset[];
  /** Called with the finished range when confirmed: a preset, or confirmed selection. */
  onPick: (range: DateRange) => void;
  /** A reason to refuse a range, shown under the calendar; the range is then not applied. */
  validate?: (range: DateRange) => string | undefined;
  calendar?: Pick<CalendarProps, "locale" | "weekStartsOn" | "disabled" | "timeZone">;
  confirmLabel?: string;
  clampDate?: ({ day }: { day: Date }) => Date;
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

/** Presets beside two months with a confirm button to commit the selected span. */
export function DateRangePanel({
  range,
  presets,
  onPick,
  validate,
  calendar,
  confirmLabel = "Confirm",
  clampDate,
}: DateRangePanelProps) {
  const [selected, setSelected] = useState<DateRange | undefined>(range);
  const [start, setStart] = useState<Date | undefined>();
  const [error, setError] = useState<string | undefined>();

  const click = ({ day }: { day: Date }) => {
    const effectiveDay = clampDate ? clampDate({ day }) : day;
    if (!start) {
      setStart(effectiveDay);
      setSelected({ from: effectiveDay, to: undefined });
      setError(undefined);
      return;
    }
    const from = effectiveDay < start ? effectiveDay : start;
    const to = effectiveDay < start ? start : effectiveDay;
    const next: DateRange = { from, to };
    setStart(undefined);
    setSelected(next);
    const message = validate?.(next);
    setError(message);
  };

  const pickPreset = ({ next }: { next: DateRange }) => {
    setStart(undefined);
    setSelected(next);
    const message = validate?.(next);
    setError(message);
  };

  const handleConfirm = () => {
    if (!selected?.from || !selected?.to) return;
    const message = validate?.(selected);
    if (message) {
      setError(message);
      return;
    }
    onPick(selected);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <PresetList presets={presets} onPreset={(next) => pickPreset({ next })} />
        <div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={selected?.from ?? range?.from}
            selected={start ? { from: start, to: undefined } : selected}
            onDayClick={(day) => click({ day })}
            {...calendar}
          />
          {error ? <p className="px-2 pt-1 text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
      <div className="flex items-center justify-end border-t border-border/50 pt-2">
        <Button
          size="sm"
          disabled={!selected?.from || !selected?.to || Boolean(error)}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
