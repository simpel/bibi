"use client";

import { FormControl, FormController, FormItem, FormLabel, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { HoursValues } from "./hours-values";

export type HoursExceptionInputProps = {
  form: UseFormReturn<HoursValues>;
  index: number;
  field: "date" | "note";
};

/** The date or the note of one exception. */
export function HoursExceptionInput({ form, index, field }: HoursExceptionInputProps) {
  const t = useTranslations("hours");
  return (
    <FormController
      control={form.control}
      name={`exceptions.${index}.${field}`}
      render={({ field: control }) => (
        <FormItem className="grid gap-1">
          <FormLabel className="text-xs text-muted-foreground">
            {field === "date" ? t("exceptionDate") : t("exceptionNote")}
          </FormLabel>
          <FormControl>
            <Input type={field === "date" ? "date" : "text"} maxLength={200} {...control} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
