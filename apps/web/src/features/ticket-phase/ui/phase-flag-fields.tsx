import type { TicketPhaseCreateInput } from "@okazi/core/schemas";
import { PHASE_FLAGS } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import type { TicketPhaseFormValues } from "./ticket-phase-form-schema";

export type PhaseFlagFieldsProps = {
  form: UseFormReturn<TicketPhaseFormValues, unknown, TicketPhaseCreateInput>;
};

/** One checkbox per phase flag (ADR 0043), each named as a plain choice. */
export function PhaseFlagFields({ form }: PhaseFlagFieldsProps) {
  const t = useTranslations("ticketPhase.flags");
  return (
    <fieldset className="grid gap-2">
      {PHASE_FLAGS.map((flag) => (
        <CheckField key={flag} form={form} name={flag} label={t(flag)} />
      ))}
    </fieldset>
  );
}
