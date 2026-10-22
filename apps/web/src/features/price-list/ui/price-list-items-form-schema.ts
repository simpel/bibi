import type { PriceListDto } from "@bibi/core";
import { PriceListSetItemsInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** One row of the item prices form: the item and its agreed price in kronor. */
export type PriceListItemRowValues = { itemId: string; price: string };

export type PriceListItemsFormValues = { items: PriceListItemRowValues[] };

export type PriceListItemsFormOutput = z.infer<typeof PriceListSetItemsInputSchema>;

const toMinor = ({ value }: { value: string }) => {
  const kr = numberOrNull({ value });
  return kr === null ? Number.NaN : Math.round(kr * 100);
};

/** Core's `priceList.setItems` schema; the rows replace the whole set. */
export const priceListItemsFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: PriceListSetItemsInputSchema,
    toInput: ({ values }: { values: PriceListItemsFormValues }) => ({
      id,
      items: values.items.map(({ itemId, price }) => ({
        itemId,
        priceMinor: toMinor({ value: price }),
      })),
    }),
  });

export const EMPTY_ROW: PriceListItemRowValues = { itemId: "", price: "" };

export function priceListItemsDefaults({ priceList }: { priceList: PriceListDto }) {
  return {
    items: priceList.items.map(({ itemId, priceMinor }) => ({
      itemId,
      price: String(priceMinor / 100),
    })),
  } satisfies PriceListItemsFormValues;
}
