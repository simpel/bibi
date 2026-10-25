"use client";

import {
  Button,
  Checkbox,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  Input,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { HoursClosedToggle } from "./hours-closed-toggle";
import { HoursExceptionInput } from "./hours-exception-input";
import { HoursTimeField } from "./hours-time-field";
import type { HoursValues } from "./hours-values";

export type HoursExceptionRowProps = {
  form: UseFormReturn<HoursValues>;
  index: number;
  onRemove: () => void;
};

const TIMES = ["start", "end", "breakStart", "breakEnd"] as const;

/** One dated exception: the day, closed or other hours with an optional break, and a note. */
export function HoursExceptionRow({ form, index, onRemove }: HoursExceptionRowProps) {
  const t = useTranslations("hours");
  const closed = form.watch(`exceptions.${index}.closed`);
  return (
    <fieldset className="grid gap-2 border-b pb-3 last:border-0">
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <HoursExceptionInput form={form} index={index} field="date" />
        <HoursExceptionInput form={form} index={index} field="note" />
        <Button type="button" variant="ghost" onClick={onRemove}>
          {t("removeException")}
        </Button>
      </div>
      <HoursClosedToggle form={form} index={index} />
      {closed ? null : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIMES.map((field) => (
            <HoursTimeField
              key={field}
              form={form}
              index={index}
              list="exceptions"
              field={field}
              disabled={false}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}
