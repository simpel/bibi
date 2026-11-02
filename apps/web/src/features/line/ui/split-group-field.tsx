import { useTranslations } from "next-intl";
import type { Path, UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ChooseOptionsFormValues } from "./choose-options-schema";
import type { CustomisableItem } from "./program-form-data";

export type SplitGroupFieldProps<V extends ChooseOptionsFormValues, O> = {
  /** Any form whose values carry `groups` as the options form does (also the intake's line). */
  form: UseFormReturn<V, unknown, O>;
  index: number;
  group: CustomisableItem["groups"][number];
  /** The line's effective quantity the split should add up to; null while unknown. */
  quantity: number | null;
};

/** A split group (ADR 0082): a quantity per option, 0 = not chosen. */
export function SplitGroupField<V extends ChooseOptionsFormValues, O>({
  form,
  index,
  group,
  quantity,
}: SplitGroupFieldProps<V, O>) {
  const t = useTranslations("line");
  const effects = useTranslations("priceEffect");
  const { name, minPick: min, maxPick: max } = group;
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">
        {t("optionGroup", { name, min, max, same: String(min === max) })}
      </legend>
      {quantity === null ? null : (
        <p className="text-sm text-muted-foreground">{t("optionSplitHint", { quantity })}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {group.options.map((option) => (
          <TextField
            key={option.itemId}
            form={form}
            name={`groups.${index}.quantities.${option.itemId}` as Path<V>}
            label={t("optionChoice", { name: option.name, effect: effects(option.priceEffect) })}
            type="number"
            step="1"
          />
        ))}
      </div>
    </fieldset>
  );
}
