import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { OptionSelectField } from "../../booking/ui/option-select-field";
import type { SeriesFormData } from "./series-form-data";
import type { SeriesFormOutput, SeriesFormValues } from "./series-form-schema";

export type SeriesFieldsProps = {
  form: UseFormReturn<SeriesFormValues, unknown, SeriesFormOutput>;
  data: SeriesFormData;
};

/** Customer, recurrence rule, first start and length. */
function SeriesTimeFields({ form, data }: SeriesFieldsProps) {
  const t = useTranslations("bookingSeries.fields");
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("customer")}
        options={data.customers}
      />
      <div className="grid gap-1">
        <TextField form={form} name="rule" label={t("rule")} required />
        <p className="text-sm text-muted-foreground">{t("ruleHint")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="startsAt"
          label={t("startsAt")}
          type="datetime-local"
          required
        />
        <TextField
          form={form}
          name="durationMinutes"
          label={t("durationMinutes")}
          type="number"
          required
        />
      </div>
    </>
  );
}

/** Room, setup and headcount every occurrence gets. */
function SeriesPlaceFields({ form, data }: SeriesFieldsProps) {
  const t = useTranslations("bookingSeries.fields");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelectField
          control={form.control}
          name="itemId"
          label={t("room")}
          options={data.rooms}
          noneLabel={t("noRoom")}
        />
        <OptionSelectField
          control={form.control}
          name="setupId"
          label={t("setup")}
          options={data.setups}
          noneLabel={t("noSetup")}
        />
      </div>
      <TextField
        form={form}
        name="estimatedHeadcount"
        label={t("estimatedHeadcount")}
        type="number"
      />
    </>
  );
}

/** The series' own fields (the type's own fields come after). */
export function SeriesFields(props: SeriesFieldsProps) {
  return (
    <>
      <SeriesTimeFields {...props} />
      <SeriesPlaceFields {...props} />
    </>
  );
}
