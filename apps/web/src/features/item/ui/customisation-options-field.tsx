import { Button, FormController, FormItem, FormMessage } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { CustomisationOptionRow } from "./customisation-option-row";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type CustomisationOptionsFieldProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  groupIndex: number;
  items: ItemFormData["parts"];
};

/** The options' own errors (e.g. too few for maxPick), under the rows. */
const GroupMessage = () => (
  <FormItem>
    <FormMessage />
  </FormItem>
);

const EMPTY = { itemId: "", priceEffect: "INCLUDED" as const };

/** The options of one customisation group: other items, each with its price effect. */
export function CustomisationOptionsField({
  form,
  groupIndex,
  items,
}: CustomisationOptionsFieldProps) {
  const t = useTranslations("item.customisationGroups");
  const name = `customisationGroups.${groupIndex}.options` as const;
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  return (
    <div className="grid gap-2 sm:col-span-3">
      <p className="text-sm font-medium">{t("options")}</p>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
      ) : null}
      {fields.map((field, index) => (
        <CustomisationOptionRow
          key={field.id}
          form={form}
          name={`${name}.${index}`}
          items={items}
          onRemove={() => remove(index)}
        />
      ))}
      <FormController control={form.control} name={name} render={GroupMessage} />
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY)}>
          <PlusIcon className="size-4" />
          {t("addOption")}
        </Button>
      </div>
    </div>
  );
}
