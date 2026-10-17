import "server-only";
import type { Result } from "@okazi/core";
import { FIXED_ROLES, listEntityTypes, listVocabularies } from "@okazi/core";
import { getTranslations } from "next-intl/server";
import { runOperation } from "@/server/run-operation";
import type { SheetOptions } from "./ui/sheet-options";

const LIMIT = 100;

/**
 * What a sheet definition can include (item types with their fields, lists) and the fixed roles
 * it can go to (ADR 0034, until sheets go to a responsibility).
 */
export async function loadSheetOptions(): Promise<Result<SheetOptions>> {
  const [types, lists, role] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
    getTranslations("role"),
  ]);
  if (!types.ok) return types;
  if (!lists.ok) return lists;
  const named = ({ id, name }: { id: string; name: string }) => ({ id, name });
  return {
    ok: true,
    value: {
      types: types.value.items.map((type) => ({ ...named(type), fields: type.fields.map(named) })),
      lists: lists.value.items.map(named),
      roles: FIXED_ROLES.map((id) => ({ id, name: role(id) })),
    },
  };
}
