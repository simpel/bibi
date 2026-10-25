"use client";

import type { UseFormReturn } from "react-hook-form";
import { HoursDayRow } from "./hours-day-row";
import { HoursExceptionsEditor } from "./hours-exceptions-editor";
import type { HoursValues } from "./hours-values";

export type HoursWeekEditorProps = {
  form: UseFormReturn<HoursValues>;
  /** Venue and item hours have dated exceptions; the welcome step does not. */
  withExceptions: boolean;
};

/** The one hours editor: seven weekday rows, plus the exceptions list when asked for. */
export function HoursWeekEditor({ form, withExceptions }: HoursWeekEditorProps) {
  const rows = form.watch("rows");
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-lg border p-4">
        {rows.map((row, index) => (
          <HoursDayRow key={row.weekday} form={form} index={index} />
        ))}
      </div>
      {withExceptions ? <HoursExceptionsEditor form={form} /> : null}
    </div>
  );
}
