"use client";

import { type ComponentProps, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "../button/button";
import { Calendar, type CalendarProps } from "../calendar/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";
import { DatePickerTrigger } from "./date-picker-trigger";
import { DateRangePanel, type DateRangePanelProps } from "./date-range-panel";

export type DateButtonProps = {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  /** The chosen date in the user's date format. */
  label: string;
  placeholder: string;
  /** Adds a clear action for an optional date. */
  clearLabel?: string;
  calendar?: Pick<CalendarProps, "locale" | "weekStartsOn" | "disabled">;
} & Pick<
  ComponentProps<typeof DatePickerTrigger>,
  "id" | "disabled" | "aria-invalid" | "aria-describedby"
>;

type DatePanelProps = Pick<DateButtonProps, "value" | "clearLabel" | "calendar"> & {
  onPick: (value: Date | undefined) => void;
};

function DatePanel({ value, clearLabel, calendar, onPick }: DatePanelProps) {
  return (
    <>
      <Calendar
        mode="single"
        defaultMonth={value}
        selected={value}
        onSelect={(day) => day && onPick(day)}
        {...calendar}
      />
      {clearLabel && value ? (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => onPick(undefined)}>
          {clearLabel}
        </Button>
      ) : null}
    </>
  );
}

/** One date: a button that shows it and opens a calendar; picking a day closes the calendar. */
export function DateButton({
  value,
  onChange,
  label,
  placeholder,
  clearLabel,
  calendar,
  ...aria
}: DateButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DatePickerTrigger label={label} placeholder={placeholder} {...aria} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <DatePanel
          {...{ value, clearLabel, calendar }}
          onPick={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export type DateRangeButtonProps = Omit<DateRangePanelProps, "onPick"> & {
  onChange: (range: DateRange) => void;
  /** The span in the user's date format. */
  label: string;
  placeholder: string;
  disabled?: boolean;
  id?: string;
};

/** A span: a button that shows it and opens presets and a calendar; finishing a span closes it. */
export function DateRangeButton({
  onChange,
  label,
  placeholder,
  disabled,
  id,
  ...panel
}: DateRangeButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DatePickerTrigger label={label} placeholder={placeholder} disabled={disabled} id={id} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-2">
        <DateRangePanel
          {...panel}
          onPick={(range) => {
            setOpen(false);
            onChange(range);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
