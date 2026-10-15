import "server-only";
import type { Result } from "@okazi/core";
import { listEntityTypes, listRoles, listVocabularies } from "@okazi/core";
import { runOperation } from "@/server/run-operation";
import type { SheetOptions } from "./ui/sheet-options";

const LIMIT = 100;

/**
 * What a sheet definition can include (item types with their fields, lists) and the roles it can
 * go to. Roles need `role:read`: without it only the ids are known, so the list stays empty.
 */
export async function loadSheetOptions(): Promise<Result<SheetOptions>> {
  const [types, lists, roles] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
    runOperation({ operation: listRoles, input: { limit: LIMIT } }),
  ]);
  if (!types.ok) return types;
  if (!lists.ok) return lists;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      types: types.value.items.map((type) => ({ ...named(type), fields: type.fields.map(named) })),
      lists: lists.value.items.map(named),
      roles: roles.ok ? roles.value.items.map(named) : [],
    },
  };
}
