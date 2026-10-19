import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ProgramFormData } from "./program-form-data";
import { ProgramPlaceFields } from "./program-place-fields";
import { ProgramPriceFields } from "./program-price-fields";

export type ProgramCoreFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
};

/** Name, time (both empty: untimed), where, quantity, price overrides and the note. */
export function ProgramCoreFields({ form, data }: ProgramCoreFieldsProps) {
  const t = useTranslations("line");
  const time = { form, type: "datetime-local" } as const;
  return (
    <>
      <TextField form={form} name="name" label={t("fields.name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField {...time} name="startsAt" label={t("fields.startsAt")} />
        <TextField {...time} name="endsAt" label={t("fields.endsAt")} />
      </div>
      <ProgramPlaceFields form={form} data={data} />
      <TextField form={form} name="quantity" label={t("fields.quantity")} type="number" />
      <ProgramPriceFields form={form} />
      <TextField form={form} name="note" label={t("fields.note")} multiline />
    </>
  );
}
