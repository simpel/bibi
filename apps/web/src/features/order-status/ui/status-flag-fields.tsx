import { STATUS_EVENTS, STATUS_FLAGS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { OrderStatusEdit, OrderStatusFormValues } from "./order-status-form-schema";

export type StatusFlagFieldsProps = {
  form: UseFormReturn<OrderStatusFormValues, unknown, OrderStatusEdit>;
};

/**
 * One checkbox per status flag and the quote event select (ADR 0043), each a plain choice. A
 * status never both holds tasks and closes the order (ADR 0121): each switch waits for the other.
 */
export function StatusFlagFields({ form }: StatusFlagFieldsProps) {
  const t = useTranslations("orderStatus.flags");
  const [closes, tasks] = form.watch(["closes", "tasks"]);
  return (
    <fieldset className="grid gap-2">
      {STATUS_FLAGS.map((flag) => (
        <CheckField
          key={flag}
          form={form}
          name={flag}
          label={t(flag)}
          description={flag === "tasks" ? t("tasksHelp") : undefined}
          disabled={(flag === "closes" && tasks) || (flag === "tasks" && closes)}
        />
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
