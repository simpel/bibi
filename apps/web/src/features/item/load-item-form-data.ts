import "server-only";
import type { Result } from "@okazi/core";
import { listEntityTypes, listItems, listSetups, listVenues, listVocabularies } from "@okazi/core";
import { loadLinkTargets } from "@/server/load-link-targets";
import { runOperation } from "@/server/run-operation";
import type { ItemFormData } from "./ui/item-form-data";

const LIMIT = 100;

export type LoadItemFormDataInput = {
  /** A customer's bundle: its own bundles can be parts too, next to the catalog. */
  customerId?: string | null | undefined;
};

/**
 * Everything the item form needs to render a type's fields and capabilities (one page each).
 * Without `venue:read` the venues are hidden (ADR 0050 feature scope), not an error.
 */
export async function loadItemFormData({
  customerId,
}: LoadItemFormDataInput = {}): Promise<Result<ItemFormData>> {
  const [types, vocabularies, setups, venues, parts] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
    runOperation({ operation: listVenues, input: { limit: LIMIT } }),
    runOperation({
      operation: listItems,
      input: { limit: LIMIT, ...(customerId ? { customerId } : {}) },
    }),
  ]);
  if (!types.ok) return types;
  if (!vocabularies.ok) return vocabularies;
  if (!setups.ok) return setups;
  if (!venues.ok && venues.error.code !== "FORBIDDEN") return venues;
  if (!parts.ok) return parts;
  const links = await loadLinkTargets({ types: types.value.items });
  return {
    ok: true,
    value: {
      types: types.value.items,
      vocabularies: vocabularies.value.items,
      links,
      setups: setups.value.items,
      venues: venues.ok ? venues.value.items.map(({ id, name }) => ({ id, name })) : [],
      venuesHidden: !venues.ok,
      parts: parts.value.items.map(({ id, name }) => ({ id, name })),
    },
  };
}
