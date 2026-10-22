import "server-only";
import { type ItemDto, listItems } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { CustomisableItem } from "./ui/program-form-data";

const LIMIT = 100;

type ToCustomisableInput = { item: ItemDto; names: ReadonlyMap<string, string> };

function toCustomisable({ item, names }: ToCustomisableInput): CustomisableItem {
  return {
    itemId: item.id,
    groups: item.customisationGroups.map(({ name, minPick, maxPick, options }) => ({
      ...{ name, minPick, maxPick },
      options: options.map(({ itemId, priceEffect }) => ({
        ...{ itemId, priceEffect },
        name: names.get(itemId) ?? "–",
      })),
    })),
  };
}

/**
 * The catalog's items with customisation groups (ADR 0059), with the names of their options (one
 * page). A caller who may not read items gets none: the lines show without the option picker.
 */
export async function loadCustomisableItems(): Promise<CustomisableItem[]> {
  const items = await runOperation({ operation: listItems, input: { limit: LIMIT } });
  if (!items.ok) return [];
  const names = new Map(items.value.items.map(({ id, name }) => [id, name]));
  return items.value.items
    .filter((item) => item.customisationGroups.length > 0)
    .map((item) => toCustomisable({ item, names }));
}
