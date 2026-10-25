"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { BLANK_EXCEPTION } from "../lib/hours-exceptions";
import { HoursExceptionRow } from "./hours-exception-row";
import type { HoursValues } from "./hours-values";

/** The list of dated exceptions with add and remove. */
export function HoursExceptionsEditor({ form }: { form: UseFormReturn<HoursValues> }) {
  const t = useTranslations("hours");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "exceptions" });
  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">{t("exceptions")}</h3>
      <p className="text-xs text-muted-foreground">{t("exceptionsHelp")}</p>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noExceptions")}</p>
      ) : null}
      {fields.map((field, index) => (
        <HoursExceptionRow
          key={field.id}
          form={form}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() => append(BLANK_EXCEPTION)}
      >
        {t("addException")}
      </Button>
    </div>
  );
}
