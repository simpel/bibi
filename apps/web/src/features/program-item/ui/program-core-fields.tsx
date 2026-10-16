import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramItemFormOutput } from "./program-item-form-schema";
import type { ProgramItemFormValues } from "./program-item-form-values";
import { ProgramPlaceFields } from "./program-place-fields";

export type ProgramCoreFieldsProps = {
  form: UseFormReturn<ProgramItemFormValues, unknown, ProgramItemFormOutput>;
  data: ProgramFormData;
  /** On create; an existing program item changes its responsible person with assign. */
  withResponsible: boolean;
};

/** Name, time, where, quantity, (on create) the responsible person and the note. */
export function ProgramCoreFields({ form, data, withResponsible }: ProgramCoreFieldsProps) {
  const t = useTranslations("programItem");
  const time = { form, type: "datetime-local", required: true } as const;
  return (
    <>
      <TextField form={form} name="name" label={t("fields.name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField {...time} name="startsAt" label={t("fields.startsAt")} />
        <TextField {...time} name="endsAt" label={t("fields.endsAt")} />
      </div>
      <ProgramPlaceFields form={form} data={data} />
      <TextField form={form} name="quantity" label={t("fields.quantity")} type="number" />
      {withResponsible ? (
        <OptionSelectField
          control={form.control}
          name="responsibleId"
          label={t("fields.responsible")}
          options={data.members}
          noneLabel={t("noResponsible")}
        />
      ) : null}
      <TextField form={form} name="note" label={t("fields.note")} multiline />
    </>
  );
}
