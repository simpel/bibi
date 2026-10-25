"use client";

import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { daysFromRows, type HoursRow } from "@/features/hours/lib/hours";
import { HoursSummary } from "@/features/hours/ui/hours-summary";
import type { HoursValues } from "@/features/hours/ui/hours-values";
import { HoursWeekEditor } from "@/features/hours/ui/hours-week-editor";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { saveHoursAction } from "../../actions";
import { welcomePath } from "../../lib/welcome-step";
import { WelcomeStepActions } from "../welcome-step-actions";

export type HoursFormProps = { org: string; rows: HoursRow[] };

/** The week as one summary with Change; Continue saves it (ADR 0061). */
export function HoursForm({ org, rows }: HoursFormProps) {
  const t = useTranslations("welcome");
  const common = useTranslations("common");
  const hours = useTranslations("hours");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const form = useForm<HoursValues>({ defaultValues: { rows, exceptions: [] } });
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
          <HoursWeekEditor form={form} withExceptions={false} />
        ) : (
          <HoursSummary rows={current} />
        )}
        <WelcomeStepActions
          back={{ href: welcomePath({ step: "profile" }), org }}
          pending={pending}
          aside={
            <Button type="button" variant="ghost" onClick={() => setEditing(!editing)}>
              {editing ? hours("done") : hours("change")}
            </Button>
          }
        />
      </form>
    </Form>
  );
}
