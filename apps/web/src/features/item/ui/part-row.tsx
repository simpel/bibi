import { Button } from "@bibi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";
import { PartSelect } from "./part-select";

export type PartRowProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  index: number;
  parts: ItemFormData["parts"];
  onRemove: () => void;
};

/** One part: which item, how many, when relative to the parent, and whether it is mandatory. */
export function PartRow({ form, index, parts, onRemove }: PartRowProps) {
  const t = useTranslations("item.parts");
  const name = `parts.${index}` as const;
  return (
    <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
      <PartSelect form={form} index={index} parts={parts} />
      <TextField form={form} name={`${name}.quantity`} label={t("quantity")} type="number" />
      <TextField
        form={form}
        name={`${name}.offsetMinutes`}
        label={t("offsetMinutes")}
        type="number"
      />
      <TextField
        form={form}
        name={`${name}.durationMinutes`}
        label={t("durationMinutes")}
        type="number"
      />
      <div className="flex items-end justify-between gap-2">
        <CheckField form={form} name={`${name}.required`} label={t("required")} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("remove")}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
