import { Button, FormController, FormItem, FormMessage } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { CustomisationGroupRow } from "./customisation-group-row";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type CustomisationGroupsSectionProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  /** Items that can be offered as options (the item itself is left out). */
  items: ItemFormData["parts"];
};

const EMPTY = {
  name: "",
  minPick: "1",
  maxPick: "1",
  options: [{ itemId: "", priceEffect: "INCLUDED" as const }],
};

/** CUSTOMISATIONS capability: groups of other items to choose between, replaced as a set on save. */
export function CustomisationGroupsSection({ form, items }: CustomisationGroupsSectionProps) {
  const t = useTranslations("item");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customisationGroups",
  });
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-semibold">{t("sections.customisations")}</legend>
      <p className="text-sm text-muted-foreground">
        {fields.length === 0 ? t("customisationGroups.none") : t("customisationGroups.hint")}
      </p>
      {fields.map((field, index) => (
        <CustomisationGroupRow
          key={field.id}
          form={form}
          index={index}
          items={items}
          onRemove={() => remove(index)}
        />
      ))}
      <FormController
        control={form.control}
        name="customisationGroups"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY)}>
          <PlusIcon className="size-4" />
          {t("customisationGroups.add")}
        </Button>
      </div>
    </fieldset>
  );
}
