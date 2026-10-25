"use client";

import { DEFAULT_WORKING_HOURS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { daysFromRows, rowsFromDays } from "../lib/hours";
import { exceptionRowsFrom, exceptionsFromRows } from "../lib/hours-exceptions";
import type { HoursSectionFormProps } from "./hours-section-form";
import type { HoursValues } from "./hours-values";

/** The form, its editing flag and the save flow of a venue or item hours section. */
export function useHoursSectionForm({
  initial,
  save,
}: Pick<HoursSectionFormProps, "initial" | "save">) {
  const t = useTranslations("hours");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const empty = initial.days.length === 0 && initial.exceptions.length === 0;
  const form = useForm<HoursValues>({
    defaultValues: {
      rows: rowsFromDays({ days: empty ? DEFAULT_WORKING_HOURS : initial.days }),
      exceptions: exceptionRowsFrom({ exceptions: initial.exceptions }),
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      save({
        days: daysFromRows({ rows: values.rows }),
        exceptions: exceptionsFromRows({ rows: values.exceptions }),
      }),
    messages: { pending: t("saving"), success: t("saved") },
    onSuccess: () => {
      setEditing(false);
      router.refresh();
    },
  });
  return { form, submit, pending, editing, setEditing, empty };
}
