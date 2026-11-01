import { Button } from "@bibi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import { CustomisationOptionsField } from "./customisation-options-field";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type CustomisationGroupRowProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  index: number;
  /** Items a group can offer as options. */
  items: ItemFormData["parts"];
  onRemove: () => void;
};

/**
 * One customisation group: name, how many to pick, whether the choice is split between guests
 * (ADR 0082), and which items are the options.
 */
export function CustomisationGroupRow(props: CustomisationGroupRowProps) {
  const { form, index, items, onRemove } = props;
  const t = useTranslations("item.customisationGroups");
  const name = `customisationGroups.${index}` as const;
  return (
    <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
      <TextField form={form} name={`${name}.name`} label={t("name")} />
      <TextField form={form} name={`${name}.minPick`} label={t("minPick")} type="number" />
      <TextField form={form} name={`${name}.maxPick`} label={t("maxPick")} type="number" />
      <div className="sm:col-span-3">
        <CheckField form={form} name={`${name}.split`} label={t("split")} />
      </div>
      <CustomisationOptionsField form={form} groupIndex={index} items={items} />
      <RemoveButton label={t("remove")} onRemove={onRemove} />
    </div>
  );
}

type RemoveButtonProps = { label: string; onRemove: () => void };

function RemoveButton({ label, onRemove }: RemoveButtonProps) {
  return (
    <div className="flex justify-end sm:col-span-3">
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={label}>
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}
