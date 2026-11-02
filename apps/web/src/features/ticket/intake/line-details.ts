import type { NamedOption } from "@/components/form/named-option";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";

/** The parts of a line's second row, each a name or a count, never formatted text. */
export type LineDetails = {
  setup: string | null;
  /** "Fish" or, in a split group, "Fish" with its quantity. */
  choices: { name: string; quantity: number | null }[];
  needs: { name: string; quantity: number }[];
  unitPriceMinor: number | null;
  discountPercent: number | null;
  note: string | null;
};

export type LineDetailsInput = {
  line: DraftLine;
  items: readonly CatalogItem[];
  needValues: readonly NamedOption[];
};

/** What the lines table writes under a line's name (spec "Lines table"). */
export function lineDetails({ line, items, needValues }: LineDetailsInput): LineDetails {
  const item = items.find(({ id }) => id === line.itemId);
  const options = new Map(
    (item?.groups ?? []).flatMap((group) =>
      group.options.map(({ itemId, name }) => [itemId, name]),
    ),
  );
  const values = new Map(needValues.map(({ id, name }) => [id, name]));
  return {
    setup: item?.setups.find(({ id }) => id === line.setupId)?.name ?? null,
    choices: line.options.map(({ itemId, quantity }) => ({
      name: options.get(itemId) ?? "–",
      quantity,
    })),
    needs: line.needs.map(({ vocabularyValueId, quantity }) => ({
      name: values.get(vocabularyValueId) ?? "–",
      quantity,
    })),
    unitPriceMinor: line.unitPriceMinor,
    discountPercent: line.discountPercent,
    note: line.note,
  };
}
