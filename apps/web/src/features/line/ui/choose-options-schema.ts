import type { LineDto } from "@bibi/core";
import { LineChooseOptionsInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";
import type { CustomisableItem } from "./program-form-data";

/** Raw values of the options form: the chosen option item ids, one list per group. */
export type ChooseOptionsFormValues = { groups: string[][] };

/** Core's `line.chooseOptions` schema over the raw form values, for one line. */
export function chooseOptionsSchema({ lineId }: { lineId: string }) {
  return formSchema({
    schema: LineChooseOptionsInputSchema,
    toInput: ({ values }: { values: ChooseOptionsFormValues }) => ({
      lineId,
      optionItemIds: values.groups.flat(),
    }),
  });
}

export type ChosenOptionsInput = { line: LineDto; lines: readonly LineDto[] };

/** The item ids of the line's current option lines. */
export function chosenOptions({ line, lines }: ChosenOptionsInput): string[] {
  return lines
    .filter((other) => other.parentLineId === line.id && other.priceEffect !== null)
    .flatMap((other) => (other.itemId ? [other.itemId] : []));
}

export type ChooseOptionsDefaultsInput = { item: CustomisableItem; chosen: readonly string[] };

/** The current choices, split per group. */
export const chooseOptionsDefaults = ({
  item,
  chosen,
}: ChooseOptionsDefaultsInput): ChooseOptionsFormValues => ({
  groups: item.groups.map((group) =>
    group.options.map(({ itemId }) => itemId).filter((id) => chosen.includes(id)),
  ),
});
