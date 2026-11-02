import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ItemSearch } from "./item-search";
import { AddOnRow } from "./line-add-on-rows";
import { useLineAddOns } from "./use-line-add-ons";
import type { LineDialogFormApi } from "./use-line-dialog-form";
import type { ReviewModel } from "./use-review-model";

export type LineAddOnsFieldProps = {
  form: LineDialogFormApi;
  model: ReviewModel;
  /** The line's quantity, which add-ons follow unless given their own. */
  quantity: number;
};

function AddItemButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("ticketIntake.line");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="justify-self-start"
      onClick={onClick}
    >
      {t("addItem")}
    </Button>
  );
}

/**
 * The line's add-ons (ADR 0088, spec "The line dialog"): items added with "Add an item", each
 * with the item's catalog price (the preview prices it exactly once in the draft).
 */
export function LineAddOnsField({ form, model, quantity }: LineAddOnsFieldProps) {
  const t = useTranslations("ticketIntake.line");
  const addOns = useLineAddOns({ form, model });
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{t("addOns")}</legend>
      {addOns.fields.map((row, index) => (
        <AddOnRow
          key={row.id}
          {...{ form, index, lineQuantity: quantity }}
          price={addOns.priceOf(row)}
          onRemove={() => addOns.remove(index)}
        />
      ))}
      {addOns.searching ? (
        <ItemSearch
          model={model}
          onItem={({ item: chosen }) => addOns.add({ chosen })}
          onFreeText={() => addOns.add({ chosen: null })}
        />
      ) : (
        <AddItemButton onClick={() => addOns.setSearching(true)} />
      )}
    </fieldset>
  );
}
