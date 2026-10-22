"use client";

import { FormControl, FormController, FormItem, FormLabel, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { HoursRow } from "../../lib/hours";

export type HoursTimeFieldProps = {
  form: UseFormReturn<{ rows: HoursRow[] }>;
  index: number;
  field: "start" | "end" | "breakStart" | "breakEnd";
  disabled: boolean;
};

/** One `HH:MM` input of a weekday row. */
export function HoursTimeField({ form, index, field, disabled }: HoursTimeFieldProps) {
  const t = useTranslations("welcome.hours");
  return (
    <FormController
      control={form.control}
      name={`rows.${index}.${field}`}
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
