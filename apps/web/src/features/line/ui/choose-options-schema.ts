import type { LineDto } from "@bibi/core";
import { LineChooseOptionsInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";
import type { CustomisableItem } from "./program-form-data";

/**
 * Raw values of one group: the picked option item ids (a normal group) or the quantity per option
 * item id, "0" = not chosen (a split group, ADR 0082).
 */
export type ChooseOptionsGroupValue = { picked: string[]; quantities: Record<string, string> };

/** Raw values of the options form, one entry per group of the item. */
export type ChooseOptionsFormValues = { groups: ChooseOptionsGroupValue[] };

type GroupInput = { group: CustomisableItem["groups"][number]; value: ChooseOptionsGroupValue };

/** A split group's options with a quantity above 0; a normal group's picks without one. */
function groupOptions({ group, value }: GroupInput) {
  if (!group.split) return value.picked.map((itemId) => ({ itemId }));
  return group.options.flatMap(({ itemId }) => {
    const raw = value.quantities[itemId]?.trim() ?? "";
    const quantity = raw === "" ? 0 : Number(raw);
    return quantity === 0 ? [] : [{ itemId, quantity }];
  });
}

export type ChooseOptionsSchemaInput = { lineId: string; item: CustomisableItem };

/** Core's `line.chooseOptions` schema over the raw form values, for one line. */
export function chooseOptionsSchema({ lineId, item }: ChooseOptionsSchemaInput) {
  return formSchema({
    schema: LineChooseOptionsInputSchema,
    toInput: ({ values }: { values: ChooseOptionsFormValues }) => ({
      lineId,
      options: item.groups.flatMap((group, index) => {
        const value = values.groups[index] ?? { picked: [], quantities: {} };
        return groupOptions({ group, value });
      }),
    }),
  });
}

/** A chosen option of a line: its item and own quantity (null = the line's). */
export type ChosenOption = { itemId: string; quantity: number | null };

export type ChosenOptionsInput = { line: LineDto; lines: readonly LineDto[] };

/** The line's current option lines as chosen options. */
export function chosenOptions({ line, lines }: ChosenOptionsInput): ChosenOption[] {
  return lines
    .filter((other) => other.parentLineId === line.id && other.priceEffect !== null)
    .flatMap((other) => (other.itemId ? [{ itemId: other.itemId, quantity: other.quantity }] : []));
}

export type ChooseOptionsDefaultsInput = {
  item: CustomisableItem;
  chosen: readonly ChosenOption[];
};

/** The current choices, split per group. */
export const chooseOptionsDefaults = ({
  item,
  chosen,
}: ChooseOptionsDefaultsInput): ChooseOptionsFormValues => ({
  groups: item.groups.map((group) => {
    const ids = group.options.map(({ itemId }) => itemId);
    const own = chosen.filter(({ itemId }) => ids.includes(itemId));
    const quantities = ids.map((id) => {
      const quantity = own.find(({ itemId }) => itemId === id)?.quantity ?? 0;
      return [id, String(quantity)] as const;
    });
    return { picked: own.map(({ itemId }) => itemId), quantities: Object.fromEntries(quantities) };
  }),
});
