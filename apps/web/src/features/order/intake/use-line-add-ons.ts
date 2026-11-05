import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { CatalogItem } from "./catalog";
import type { LineDialogFormApi } from "./use-line-dialog-form";
import type { ReviewModel } from "./use-review-model";

export type UseLineAddOnsInput = {
  form: LineDialogFormApi;
  model: ReviewModel;
};

/**
 * The line dialog's add-ons (ADR 0088): the added rows, the catalog price of an item as
 * written, and the item search's open state.
 */
export function useLineAddOns({ form, model }: UseLineAddOnsInput) {
  const { money } = useNumberFormat();
  const [searching, setSearching] = useState(false);
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "addOns" });
  const priceOf = ({ itemId }: { itemId: string | null }) => {
    const minor = model.data.catalog.items.find(({ id }) => id === itemId)?.priceMinor ?? null;
    return minor === null ? null : money({ minor });
  };
  const add = ({ chosen }: { chosen: CatalogItem | null }) => {
    const [from, to] = [form.getValues("from"), form.getValues("to")];
    append({
      ...{ itemId: chosen?.id ?? null, name: chosen?.name ?? "", quantity: "" },
      ...{ ownTime: false, from, to, unitPriceMinor: null },
    });
    setSearching(false);
  };
  return { fields, remove, priceOf, add, searching, setSearching };
}
