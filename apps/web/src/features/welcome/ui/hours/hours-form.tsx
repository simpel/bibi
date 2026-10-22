"use client";

import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { saveHoursAction } from "../../actions";
import { daysFromRows, type HoursRow } from "../../lib/hours";
import { welcomePath } from "../../lib/welcome-step";
import { WelcomeStepActions } from "../welcome-step-actions";
import { HoursDayRow, type HoursValues } from "./hours-day-row";
import { HoursSummary } from "./hours-summary";

export type HoursFormProps = { org: string; rows: HoursRow[] };

/** The week as one summary with Change; Continue saves it (ADR 0061). */
export function HoursForm({ org, rows }: HoursFormProps) {
  const t = useTranslations("welcome");
  const common = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const form = useForm<HoursValues>({ defaultValues: { rows } });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      saveHoursAction({ input: { days: daysFromRows({ rows: values.rows }) } }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.push(welcomePath(), { org }),
  });
  const current = form.watch("rows");
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {editing ? (
          <div className="grid gap-3 rounded-lg border p-4">
            {current.map((row, index) => (
              <HoursDayRow key={row.weekday} form={form} index={index} />
            ))}
          </div>
        ) : (
          <HoursSummary rows={current} />
        )}
        <WelcomeStepActions
          back={{ href: welcomePath({ step: "profile" }), org }}
          pending={pending}
          aside={
            <Button type="button" variant="ghost" onClick={() => setEditing(!editing)}>
              {editing ? t("hours.done") : t("hours.change")}
            </Button>
          }
        />
      </form>
    </Form>
  );
}
