"use client";

import { FormControl, FormController, FormItem, FormLabel, FormMessage, Input } from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { PlainDateButton } from "./plain-date-button";

type Parts = { day: string; time: string };

type DateTimeControlsProps = {
  /** `YYYY-MM-DDTHH:mm`, or empty. */
  value: string;
  onChange: (value: string) => void;
  label: string;
  required: boolean | undefined;
};

/** The date button and the time input side by side; a time without a date is dropped. */
function DateTimeControls({ value, onChange, label, required }: DateTimeControlsProps) {
  const [day = "", time = ""] = value.split("T");
  const set = ({ day: nextDay, time: nextTime }: Parts) =>
    onChange(nextDay ? `${nextDay}T${nextTime || "00:00"}` : "");
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <FormControl>
        <PlainDateButton
          value={day}
          onChange={(next) => set({ day: next, time })}
          clearable={!required}
        />
      </FormControl>
      <Input
        type="time"
        aria-label={label}
        value={time}
        onChange={(event) => set({ day, time: event.target.value })}
        className="w-28"
      />
    </div>
  );
}

export type DateTimeFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  required?: boolean;
};

/** A form field for a local date and time (`YYYY-MM-DDTHH:mm`): the date button and a time input. */
export function DateTimeField<V extends FieldValues, O>({
  form,
  name,
  label,
  required,
}: DateTimeFieldProps<V, O>) {
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </FormLabel>
          <DateTimeControls
            value={String(field.value ?? "")}
            onChange={field.onChange}
            label={label}
            required={required}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
