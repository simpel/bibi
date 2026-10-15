import "server-only";
import { listItems, listMembers, listSetups, type Result } from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { ProgramFormData } from "./ui/program-form-data";

const LIMIT = 100;

/**
 * Program item types and lists, bookable items, setups and members (one page each). Members are
 * optional: without `member:read` the responsible person shows as "–" and cannot be picked.
 */
export async function loadProgramData(): Promise<Result<ProgramFormData>> {
  const [typed, items, setups, members] = await Promise.all([
    loadTypedFormData({ base: "PROGRAM_ITEM" }),
    runOperation({ operation: listItems, input: { behaviour: "BOOKABLE", limit: LIMIT } }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
  ]);
  if (!typed.ok) return typed;
  if (!items.ok) return items;
  if (!setups.ok) return setups;
  const people = members.ok ? members.value.items : [];
  return {
    ok: true,
    value: {
      ...typed.value,
      items: items.value.items.map(({ id, name, setups: own }) => ({
        id,
        name,
        setupIds: own.map(({ setupId }) => setupId),
      })),
      setups: setups.value.items.map(({ id, name }) => ({ id, name })),
      members: people.map(({ userId, name }) => ({ id: userId, name })),
    },
  };
}
