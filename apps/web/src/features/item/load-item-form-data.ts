import "server-only";
import type { Result } from "@bibi/core";
import { listItems, listVenues, listVocabularies } from "@bibi/core";
import { loadEntityTypesOf } from "@/server/load-entity-types";
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
  const [types, vocabularies, venues, parts] = await Promise.all([
    loadEntityTypesOf({ base: "ITEM" }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
    runOperation({ operation: listVenues, input: { limit: LIMIT } }),
    runOperation({
      operation: listItems,
      input: { limit: LIMIT, ...(customerId ? { customerId } : {}) },
    }),
  ]);
  if (!types.ok) return types;
  if (!vocabularies.ok) return vocabularies;
  if (!venues.ok && venues.error.code !== "FORBIDDEN") return venues;
  if (!parts.ok) return parts;
  const links = await loadLinkTargets({ types: types.value.items });
  return {
    ok: true,
    value: {
      types: types.value.items,
      vocabularies: vocabularies.value.items,
      links,
      venues: venues.ok ? venues.value.items.map(({ id, name }) => ({ id, name })) : [],
      venuesHidden: !venues.ok,
      parts: parts.value.items.map(({ id, name }) => ({ id, name })),
    },
  };
}
