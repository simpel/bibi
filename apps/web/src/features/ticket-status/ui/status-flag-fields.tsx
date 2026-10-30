import { STATUS_EVENTS, STATUS_FLAGS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { TicketStatusEdit, TicketStatusFormValues } from "./ticket-status-form-schema";

export type StatusFlagFieldsProps = {
  form: UseFormReturn<TicketStatusFormValues, unknown, TicketStatusEdit>;
};

/** One checkbox per status flag and the quote event select (ADR 0043), each a plain choice. */
export function StatusFlagFields({ form }: StatusFlagFieldsProps) {
  const t = useTranslations("ticketStatus.flags");
  return (
    <fieldset className="grid gap-2">
      {STATUS_FLAGS.map((flag) => (
        <CheckField key={flag} form={form} name={flag} label={t(flag)} />
      ))}
      <OptionSelectField
        control={form.control}
        name="event"
        label={t("event")}
        noneLabel={t("noEvent")}
        options={STATUS_EVENTS.map((event) => ({ id: event, name: t(`events.${event}`) }))}
      />
    </fieldset>
  );
}
