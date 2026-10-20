import { Button, FormController, FormItem, FormMessage } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray, useWatch } from "react-hook-form";
import { CustomisationGroupRow } from "./customisation-group-row";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type CustomisationGroupsSectionProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  parts: ItemFormData["parts"];
};

const EMPTY = { name: "", minPick: "1", maxPick: "1", itemIds: [] };

/** The parts currently in the form, as options a group can offer. */
function usePartOptions({ form, parts }: CustomisationGroupsSectionProps) {
  const rows = useWatch({ control: form.control, name: "parts" });
  return rows
    .filter((part) => part.itemId !== "")
    .map(({ itemId }) => ({
      value: itemId,
      label: parts.find(({ id }) => id === itemId)?.name ?? "–",
    }));
}

/** CUSTOMISATIONS capability: groups of parts to choose between, replaced as a set on save. */
export function CustomisationGroupsSection({ form, parts }: CustomisationGroupsSectionProps) {
  const t = useTranslations("item");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customisationGroups",
  });
  const options = usePartOptions({ form, parts });
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
          options={options}
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
