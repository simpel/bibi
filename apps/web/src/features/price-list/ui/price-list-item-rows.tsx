import { Button, FormController, FormItem, FormMessage } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { PriceListItemRow } from "./price-list-item-row";
import {
  EMPTY_ROW,
  type PriceListItemsFormOutput,
  type PriceListItemsFormValues,
} from "./price-list-items-form-schema";

export type PriceListItemRowsProps = {
  form: UseFormReturn<PriceListItemsFormValues, unknown, PriceListItemsFormOutput>;
  items: readonly NamedOption[];
};

/** The editable rows, the set's own error (e.g. a general discount is set) and "add item". */
export function PriceListItemRows({ form, items }: PriceListItemRowsProps) {
  const t = useTranslations("priceList.items");
  const rows = useFieldArray({ control: form.control, name: "items" });
  return (
    <>
      {rows.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      ) : null}
      {rows.fields.map((field, index) => (
        <PriceListItemRow
          key={field.id}
          form={form}
          index={index}
          items={items}
          onRemove={() => rows.remove(index)}
        />
      ))}
      <FormController
        control={form.control}
        name="items"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => rows.append(EMPTY_ROW)}>
          <PlusIcon className="size-4" />
          {t("add")}
        </Button>
      </div>
    </>
  );
}
