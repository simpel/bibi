import { Button } from "@okazi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type {
  PriceListItemsFormOutput,
  PriceListItemsFormValues,
} from "./price-list-items-form-schema";

export type PriceListItemRowProps = {
  form: UseFormReturn<PriceListItemsFormValues, unknown, PriceListItemsFormOutput>;
  index: number;
  items: readonly NamedOption[];
  onRemove: () => void;
};

/** One agreed price: which PRICED item and its price in kronor. */
export function PriceListItemRow({ form, index, items, onRemove }: PriceListItemRowProps) {
  const t = useTranslations("priceList.items");
  return (
    <div className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_8rem_auto]">
      <OptionSelectField
        control={form.control}
        name={`items.${index}.itemId`}
        label={t("item")}
        options={items}
      />
      <TextField
        form={form}
        name={`items.${index}.price`}
        label={t("price")}
        type="number"
        step="0.01"
      />
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t("remove")}>
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}
