import { Button } from "@okazi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { QuoteFormOutput, QuoteFormValues } from "./quote-form-schema";

export type QuoteLineRowProps = {
  form: UseFormReturn<QuoteFormValues, unknown, QuoteFormOutput>;
  index: number;
  items: readonly NamedOption[];
  onRemove: () => void;
};

/** One order line: the item, how many, an optional unit price in kronor and a discount. */
export function QuoteLineRow({ form, index, items, onRemove }: QuoteLineRowProps) {
  const t = useTranslations("quote.lines");
  return (
    <div className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_5rem_7rem_5rem_auto]">
      <OptionSelectField
        control={form.control}
        name={`lines.${index}.itemId`}
        label={t("item")}
        options={items}
      />
      <TextField form={form} name={`lines.${index}.quantity`} label={t("quantity")} type="number" />
      <TextField
        form={form}
        name={`lines.${index}.unitPriceMinor`}
        label={t("unitPrice")}
        type="number"
        step="0.01"
      />
      <TextField
        form={form}
        name={`lines.${index}.discountPercent`}
        label={t("discount")}
        type="number"
      />
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t("remove")}>
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}
