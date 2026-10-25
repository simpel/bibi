"use client";

import { Checkbox, FormControl, FormController, FormItem, FormLabel } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { HoursValues } from "./hours-values";

export type HoursClosedToggleProps = { form: UseFormReturn<HoursValues>; index: number };

/** "Closed all day" of one exception; unticked shows start, end and break. */
export function HoursClosedToggle({ form, index }: HoursClosedToggleProps) {
  const t = useTranslations("hours");
  return (
    <FormController
      control={form.control}
      name={`exceptions.${index}.closed`}
      render={({ field }) => (
        <FormItem className="flex items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value === true)}
            />
          </FormControl>
          <FormLabel>{t("closedAllDay")}</FormLabel>
        </FormItem>
      )}
    />
  );
}
