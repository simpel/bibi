import "server-only";
import type { Result } from "@bibi/core";
import { listResponsibilities, listVocabularies } from "@bibi/core";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";
import type { RunSheetOptions } from "./ui/run-sheet-options";

const LIMIT = 100;

/**
 * What a run sheet definition can include (item types with their fields, lists) and the
 * responsibilities it can go to (ADR 0034).
 */
export async function loadRunSheetOptions(): Promise<Result<RunSheetOptions>> {
  const [types, lists, responsibilities] = await Promise.all([
    loadEntityTypesOf({ base: "ITEM" }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
    runOperation({ operation: listResponsibilities, input: { limit: LIMIT } }),
  ]);
  if (!types.ok) return types;
  if (!lists.ok) return lists;
  if (!responsibilities.ok) return responsibilities;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      types: types.value.items.map((type) => ({ ...named(type), fields: type.fields.map(named) })),
      lists: lists.value.items.map(named),
      responsibilities: responsibilities.value.items.map(named),
    },
  };
}
