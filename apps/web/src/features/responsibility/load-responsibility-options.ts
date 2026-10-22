import "server-only";
import { listEntityTypes, listMembers, type Result } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { ResponsibilityOptions } from "./ui/responsibility-options";

const LIMIT = 100;

/** What a responsibility can cover (item types) and who can answer for it (members, by user id). */
export async function loadResponsibilityOptions(): Promise<Result<ResponsibilityOptions>> {
  const [types, members] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base: "ITEM", limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
  ]);
  if (!types.ok) return types;
  if (!members.ok) return members;
  return {
    ok: true,
    value: {
      types: types.value.items.map(({ id, name }) => ({ id, name })),
      people: members.value.items.map(({ userId, name }) => ({ id: userId, name })),
    },
  };
}
