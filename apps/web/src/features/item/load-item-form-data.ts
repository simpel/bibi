import "server-only";
import type { Result } from "@okazi/core";
import { listEntityTypes, listItems, listSetups, listVenues, listVocabularies } from "@okazi/core";
import { runOperation } from "@/server/run-operation";
import type { ItemFormData } from "./ui/item-form-data";

const LIMIT = 100;

/** Everything the item form needs to render a type's fields and behaviours (one page each). */
export async function loadItemFormData(): Promise<Result<ItemFormData>> {
  const [types, vocabularies, setups, venues, parts] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
    runOperation({ operation: listVenues, input: { limit: LIMIT } }),
    runOperation({ operation: listItems, input: { limit: LIMIT } }),
  ]);
  if (!types.ok) return types;
  if (!vocabularies.ok) return vocabularies;
  if (!setups.ok) return setups;
  if (!venues.ok) return venues;
  if (!parts.ok) return parts;
  return {
    ok: true,
    value: {
      types: types.value.items,
      vocabularies: vocabularies.value.items,
      setups: setups.value.items,
      venues: venues.value.items.map(({ id, name }) => ({ id, name })),
      parts: parts.value.items.map(({ id, name }) => ({ id, name })),
    },
  };
}
