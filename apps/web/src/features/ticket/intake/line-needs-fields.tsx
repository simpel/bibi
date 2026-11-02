import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { LineDialogFormApi } from "./use-line-dialog-form";

export type LineNeedsFieldsProps = { form: LineDialogFormApi; values: NamedOption[] };

/**
 * Needs as counts per value of the organization's lists (Vegan 2, Nut allergy 1), stored as the
 * line's requirements (ADR 0081 decision 6).
 */
export function LineNeedsFields({ form, values }: LineNeedsFieldsProps) {
  const t = useTranslations("ticketIntake.line");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "needs" });
  if (values.length === 0) return null;
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{t("needs")}</legend>
      {fields.map((row, index) => (
        <div key={row.id} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
          <OptionSelectField
            control={form.control}
            name={`needs.${index}.valueId`}
            label={t("needValue")}
            options={values}
          />
          <TextField
            form={form}
            name={`needs.${index}.count`}
            label={t("needCount")}
            type="number"
            step="1"
          />
          <Button type="button" variant="ghost" onClick={() => remove(index)}>
            {t("removeNeed")}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => append({ valueId: "", count: "1" })}
      >
        {t("addNeed")}
      </Button>
    </fieldset>
  );
}
