import { Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { DateField } from "@/components/date-picker/date-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { useZodMessages } from "@/lib/use-zod-messages";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { IntakeWhen } from "./intake-state";
import { type WhenFormValues, whenFormDefaults, whenFormSchema } from "./when-form-schema";

export type WhenStepProps = {
  when: IntakeWhen | null;
  /** What a read message gave, also when incomplete (ADR 0084); `when` wins once answered. */
  prefill?: WhenFormValues | null;
  onDone: (input: { when: IntakeWhen }) => void;
  /** Whether the step's values pass its rules now: Next waits for them. */
  onValidChange?: (input: { valid: boolean }) => void;
};

/** The form's id: its submit (Next) sits in the step's footer (`WhenSection`). */
export const WHEN_FORM_ID = "intake-when-form";

/**
 * Step 2: the day, from and to in the organization's zone, and the estimated guests. Past days
 * cannot be picked, and a start that has passed is refused.
 */
export function WhenStep({ when, prefill, onDone, onValidChange }: WhenStepProps) {
  const t = useTranslations("orderIntake.when");
  const now = toLocalInputValue({ date: new Date(), timeZone: useOrganizationTimeZone() });
  const schema = useMemo(() => whenFormSchema({ now }), [now]);
  const form = useForm<WhenFormValues, unknown, IntakeWhen>({
    resolver: zodResolver(schema, useZodMessages()),
    mode: "onTouched",
    defaultValues: when || !prefill ? whenFormDefaults({ when }) : prefill,
  });
  const valid = schema.safeParse(form.watch()).success;
  useEffect(() => onValidChange?.({ valid }), [valid, onValidChange]);
  return (
    <Form {...form}>
      <form
        id={WHEN_FORM_ID}
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => onDone({ when: values }))}
        noValidate
      >
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <DateField form={form} name="date" label={t("date")} minDay={now.slice(0, 10)} required />
          <TimeField form={form} name="from" label={t("from")} required />
          <TimeField form={form} name="to" label={t("to")} required />
          <TextField
            form={form}
            name="guests"
            label={t("guests")}
            type="number"
            step="1"
            required
          />
        </div>
        <p className="text-sm text-muted-foreground">{t("zoneHint")}</p>
      </form>
    </Form>
  );
}
