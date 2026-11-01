"use client";

import { FormControl, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { PlainDateButton } from "./plain-date-button";

export type DateFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  required?: boolean;
  /** An optional date can be cleared. */
  clearable?: boolean;
};

/** A form field for one plain date (`YYYY-MM-DD`): a button that opens the calendar. */
export function DateField<V extends FieldValues, O>({
  form,
  name,
  label,
  required,
  clearable,
}: DateFieldProps<V, O>) {
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
          <FormControl>
            <PlainDateButton
              value={field.value ?? ""}
              onChange={field.onChange}
              clearable={clearable}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
