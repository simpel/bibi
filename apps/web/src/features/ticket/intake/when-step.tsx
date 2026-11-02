import { Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { DateField } from "@/components/date-picker/date-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import { useZodMessages } from "@/lib/use-zod-messages";
import type { IntakeWhen } from "./intake-state";
import { type WhenFormValues, whenFormDefaults, whenFormSchema } from "./when-form-schema";

export type WhenStepProps = {
  when: IntakeWhen | null;
  /** What a read message gave, also when incomplete (ADR 0084); `when` wins once answered. */
  prefill?: WhenFormValues | null;
  onDone: (input: { when: IntakeWhen }) => void;
};

/** The form's id: its submit (Next) sits in the step's footer (`WhenSection`). */
export const WHEN_FORM_ID = "intake-when-form";

/** Step 2: the day, from and to in the organization's zone, and the estimated guests. */
export function WhenStep({ when, prefill, onDone }: WhenStepProps) {
  const t = useTranslations("ticketIntake.when");
  const form = useForm<WhenFormValues, unknown, IntakeWhen>({
    resolver: zodResolver(whenFormSchema, useZodMessages()),
    defaultValues: when || !prefill ? whenFormDefaults({ when }) : prefill,
  });
  return (
    <Form {...form}>
      <form
        id={WHEN_FORM_ID}
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => onDone({ when: values }))}
        noValidate
      >
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <DateField form={form} name="date" label={t("date")} required />
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
