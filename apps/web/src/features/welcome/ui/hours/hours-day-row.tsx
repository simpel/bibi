"use client";

import { Checkbox, FormControl, FormController, FormItem, FormLabel } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { HoursRow } from "../../lib/hours";
import { HoursTimeField } from "./hours-time-field";

export type HoursValues = { rows: HoursRow[] };
type Day = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export type HoursDayRowProps = { form: UseFormReturn<HoursValues>; index: number };

/** One weekday in the editor: works or not, start and end, and an optional break. */
export function HoursDayRow({ form, index }: HoursDayRowProps) {
  const t = useTranslations("welcome.hours");
  const works = form.watch(`rows.${index}.works`);
  const weekday = form.getValues(`rows.${index}.weekday`);
  return (
    <fieldset className="grid gap-2 border-b pb-3 last:border-0 sm:grid-cols-[9rem_1fr]">
      <FormController
        control={form.control}
        name={`rows.${index}.works`}
        render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(value) => field.onChange(value === true)}
              />
            </FormControl>
            <FormLabel className="font-medium">{t(`day.${String(weekday) as Day}`)}</FormLabel>
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <HoursTimeField form={form} index={index} field="start" disabled={!works} />
        <HoursTimeField form={form} index={index} field="end" disabled={!works} />
        <HoursTimeField form={form} index={index} field="breakStart" disabled={!works} />
        <HoursTimeField form={form} index={index} field="breakEnd" disabled={!works} />
      </div>
    </fieldset>
  );
}
