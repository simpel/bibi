import { Button, FormController, FormItem, FormMessage } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { ComponentRow } from "./component-row";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type ComponentsSectionProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  /** Items that can be picked as parts (the item itself is left out). */
  parts: ItemFormData["parts"];
};

const EMPTY = {
  itemId: "",
  quantity: "1",
  offsetMinutes: "0",
  durationMinutes: "",
  required: true,
};

/** COMPOSABLE behaviour: the parts, replaced as a set on save. Cycles are rejected by core. */
export function ComponentsSection({ form, parts }: ComponentsSectionProps) {
  const t = useTranslations("item");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "components" });
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-semibold">{t("sections.components")}</legend>
      <p className="text-sm text-muted-foreground">
        {fields.length === 0 ? t("components.none") : t("components.hint")}
      </p>
      {fields.map((field, index) => (
        <ComponentRow
          key={field.id}
          form={form}
          index={index}
          parts={parts}
          onRemove={() => remove(index)}
        />
      ))}
      <FormController
        control={form.control}
        name="components"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY)}>
          <PlusIcon className="size-4" />
          {t("components.add")}
        </Button>
      </div>
    </fieldset>
  );
}
