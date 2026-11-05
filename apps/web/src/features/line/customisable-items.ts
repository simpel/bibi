import "server-only";
import type { ItemDto } from "@bibi/core";
import { loadPickerItems } from "@/server/load-items-for-pickers";
import type { CustomisableItem } from "./ui/program-form-data";

type ToCustomisableInput = { item: ItemDto; names: ReadonlyMap<string, string> };

function toCustomisable({ item, names }: ToCustomisableInput): CustomisableItem {
  return {
    itemId: item.id,
    groups: item.customisationGroups.map(({ name, minPick, maxPick, split, options }) => ({
      ...{ name, minPick, maxPick, split },
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
  const items = await loadPickerItems();
  if (!items.ok) return [];
  const names = new Map(items.value.items.map(({ id, name }) => [id, name]));
  return items.value.items
    .filter((item) => item.customisationGroups.length > 0)
    .map((item) => toCustomisable({ item, names }));
}
