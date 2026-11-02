import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  MultiChoiceControl,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Path, UseFormReturn } from "react-hook-form";
import type { ChooseOptionsFormValues } from "./choose-options-schema";
import type { CustomisableItem } from "./program-form-data";

export type OptionGroupFieldProps<V extends ChooseOptionsFormValues, O> = {
  /** Any form whose values carry `groups` as the options form does (also the intake's line). */
  form: UseFormReturn<V, unknown, O>;
  index: number;
  group: CustomisableItem["groups"][number];
};

/** The options of a normal group as checkboxes, each labelled with its price effect. */
export function OptionGroupField<V extends ChooseOptionsFormValues, O>({
  form,
  index,
  group,
}: OptionGroupFieldProps<V, O>) {
  const t = useTranslations("line");
  const effects = useTranslations("priceEffect");
  const choices = group.options.map(({ itemId, name, priceEffect }) => ({
    value: itemId,
    label: t("optionChoice", { name, effect: effects(priceEffect) }),
  }));
  const { name, minPick: min, maxPick: max } = group;
  return (
    <FormController
      control={form.control}
      name={`groups.${index}.picked` as Path<V>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("optionGroup", { name, min, max, same: String(min === max) })}</FormLabel>
          <FormControl>
            <MultiChoiceControl
              value={field.value as string[]}
              onChange={field.onChange}
              choices={choices}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
