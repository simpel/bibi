import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ArrayPath, type Path, type UseFormReturn, useFieldArray } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";

/** Raw values of a line's needs, one row per list value counted. */
export type NeedsFormValues = { needs: { valueId: string; count: string }[] };

export type LineNeedsFieldsProps<V extends NeedsFormValues, O> = {
  /** Any form whose values carry `needs`: the line dialog's, or a line of the choices step. */
  form: UseFormReturn<V, unknown, O>;
  values: NamedOption[];
};

type NeedRowProps<V extends NeedsFormValues, O> = LineNeedsFieldsProps<V, O> & {
  index: number;
  onRemove: () => void;
};

/** One need: the list value and how many. */
function NeedRow<V extends NeedsFormValues, O>({
  form,
  values,
  index,
  onRemove,
}: NeedRowProps<V, O>) {
  const t = useTranslations("orderIntake.line");
  const at = ({ key }: { key: string }) => `needs.${index}.${key}` as Path<V>;
  return (
    <div className="grid grid-cols-[1fr_6rem_auto] items-start gap-2">
      <OptionSelectField
        control={form.control}
        name={at({ key: "valueId" })}
        label={t("needValue")}
        options={values}
      />
      <TextField
        form={form}
        name={at({ key: "count" })}
        label={t("needCount")}
        type="number"
        step="1"
      />
      <Button type="button" variant="ghost" className="mt-7" onClick={onRemove}>
        {t("removeNeed")}
      </Button>
    </div>
  );
}

/**
 * Needs as counts per value of the organization's lists (Vegan 2, Nut allergy 1), stored as the
 * line's requirements (ADR 0081 decision 6).
 */
export function LineNeedsFields<V extends NeedsFormValues, O>({
  form,
  values,
}: LineNeedsFieldsProps<V, O>) {
  const t = useTranslations("orderIntake.line");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "needs" as ArrayPath<V>,
  });
  if (values.length === 0) return null;
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{t("needs")}</legend>
      {fields.map((row, index) => (
        <NeedRow key={row.id} {...{ form, values, index }} onRemove={() => remove(index)} />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => append({ valueId: "", count: "1" } as never)}
      >
        {t("addNeed")}
      </Button>
    </fieldset>
  );
}
