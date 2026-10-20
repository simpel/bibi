import "server-only";
import { listItemStates, listItems, listSetups, type Result } from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { LineStateOption } from "./ui/line-state-option";
import type { ProgramFormData } from "./ui/program-form-data";

const LIMIT = 100;

/**
 * The organization's item states (a handful per item type). A caller who may not read them sees
 * the lines without states rather than no schedule at all.
 */
async function loadStates(): Promise<LineStateOption[]> {
  const states = await runOperation({ operation: listItemStates, input: { limit: LIMIT } });
  if (!states.ok) return [];
  return states.value.items.map(({ id, name, color, transitionsTo }) => ({
    id,
    name,
    color,
    transitionsTo,
  }));
}

/**
 * Program item types and lists, bookable items, setups and item states (one page each). Without
 * `item:read` the items are hidden (ADR 0050 feature scope), not an error.
 */
export async function loadProgramData(): Promise<Result<ProgramFormData>> {
  const [typed, items, setups, states] = await Promise.all([
    loadTypedFormData({ base: "PROGRAM_ITEM" }),
    runOperation({ operation: listItems, input: { behaviour: "BOOKABLE", limit: LIMIT } }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
    loadStates(),
  ]);
  if (!typed.ok) return typed;
  if (!items.ok && items.error.code !== "FORBIDDEN") return items;
  if (!setups.ok) return setups;
  return {
    ok: true,
    value: {
      ...typed.value,
      items: items.ok
        ? items.value.items.map(({ id, name, setups: own }) => ({
            id,
            name,
            setupIds: own.map(({ setupId }) => setupId),
          }))
        : [],
      itemsHidden: !items.ok,
      setups: setups.value.items.map(({ id, name }) => ({ id, name })),
      states,
    },
  };
}
