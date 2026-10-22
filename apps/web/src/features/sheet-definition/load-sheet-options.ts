import "server-only";
import type { Result } from "@bibi/core";
import { listEntityTypes, listResponsibilities, listVocabularies } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { SheetOptions } from "./ui/sheet-options";

const LIMIT = 100;

/**
 * What a sheet definition can include (item types with their fields, lists) and the
 * responsibilities it can go to (ADR 0034).
 */
export async function loadSheetOptions(): Promise<Result<SheetOptions>> {
  const [types, lists, responsibilities] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
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
