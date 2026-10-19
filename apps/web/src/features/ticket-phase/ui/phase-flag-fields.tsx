import type { TicketPhaseCreateInput } from "@okazi/core/schemas";
import { PHASE_EVENTS, PHASE_FLAGS } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { TicketPhaseFormValues } from "./ticket-phase-form-schema";

export type PhaseFlagFieldsProps = {
  form: UseFormReturn<TicketPhaseFormValues, unknown, TicketPhaseCreateInput>;
};

/** One checkbox per phase flag and the quote event select (ADR 0043), each a plain choice. */
export function PhaseFlagFields({ form }: PhaseFlagFieldsProps) {
  const t = useTranslations("ticketPhase.flags");
  return (
    <fieldset className="grid gap-2">
      {PHASE_FLAGS.map((flag) => (
        <CheckField key={flag} form={form} name={flag} label={t(flag)} />
      ))}
      <OptionSelectField
        control={form.control}
        name="event"
        label={t("event")}
        noneLabel={t("noEvent")}
        options={PHASE_EVENTS.map((event) => ({ id: event, name: t(`events.${event}`) }))}
      />
    </fieldset>
  );
}
