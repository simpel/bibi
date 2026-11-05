import "server-only";
import { listItemStates, type Result } from "@bibi/core";
import type { EntityTypeDto, ItemStateDto } from "@bibi/core/schemas";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";

export type TypeStates = { type: EntityTypeDto; states: ItemStateDto[] };

const LIMIT = 100;

/** Every item type with its active states in order (a handful of each, so never paged). */
export async function loadItemStateData(): Promise<Result<TypeStates[]>> {
  const [types, states] = await Promise.all([
    loadEntityTypesOf({ base: "ITEM" }),
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
