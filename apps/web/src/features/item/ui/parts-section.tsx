import { Button, FormController, FormItem, FormMessage } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";
import { PartRow } from "./part-row";

export type PartsSectionProps = {
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

/** BUNDLE capability: the parts, replaced as a set on save. Cycles are rejected by core. */
export function PartsSection({ form, parts }: PartsSectionProps) {
  const t = useTranslations("item");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "parts" });
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-semibold">{t("sections.parts")}</legend>
      <p className="text-sm text-muted-foreground">
        {fields.length === 0 ? t("parts.none") : t("parts.hint")}
      </p>
      {fields.map((field, index) => (
        <PartRow
          key={field.id}
          form={form}
          index={index}
          parts={parts}
          onRemove={() => remove(index)}
        />
      ))}
      <FormController
        control={form.control}
        name="parts"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY)}>
          <PlusIcon className="size-4" />
          {t("parts.add")}
        </Button>
      </div>
    </fieldset>
  );
}
