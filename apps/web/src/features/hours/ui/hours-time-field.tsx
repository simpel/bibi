"use client";

import { FormControl, FormController, FormItem, FormLabel, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { HoursValues } from "./hours-values";

export type HoursTimeFieldProps = {
  form: UseFormReturn<HoursValues>;
  index: number;
  /** Which list of the form the row belongs to; the weekly rows by default. */
  list?: "rows" | "exceptions";
  field: "start" | "end" | "breakStart" | "breakEnd";
  disabled: boolean;
};

/** One `HH:MM` input of a weekday row. */
export function HoursTimeField({
  form,
  index,
  field,
  disabled,
  list = "rows",
}: HoursTimeFieldProps) {
  const t = useTranslations("hours");
  return (
    <FormController
      control={form.control}
      name={`${list}.${index}.${field}`}
      render={({ field: control }) => (
        <FormItem className="grid gap-1">
          <FormLabel className="text-xs text-muted-foreground">{t(field)}</FormLabel>
          <FormControl>
            <Input type="time" step={900} disabled={disabled} {...control} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
