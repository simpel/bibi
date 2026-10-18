import "server-only";
import { listEntityTypes, listItemStates, type Result } from "@okazi/core";
import type { EntityTypeDto, ItemStateDto } from "@okazi/core/schemas";
import { runOperation } from "@/server/run-operation";

export type TypeStates = { type: EntityTypeDto; states: ItemStateDto[] };

const LIMIT = 100;

/** Every item type with its active states in order (a handful of each, so never paged). */
export async function loadItemStateData(): Promise<Result<TypeStates[]>> {
  const [types, states] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listItemStates, input: { limit: LIMIT } }),
  ]);
  if (!types.ok) return types;
  if (!states.ok) return states;
  const value = types.value.items.map((type) => ({
    type,
    states: states.value.items
      .filter((state) => state.entityTypeId === type.id)
      .sort((a, b) => a.position - b.position),
  }));
  return { ok: true, value };
}
