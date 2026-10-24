import "server-only";
import { listItemStates, listItems, listSetups, type Result } from "@bibi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { loadCustomisableItems } from "./customisable-items";
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
 * Line types and lists, bookable items, bundles, customisable items, setups and item states
 * (one page each), with each item's zone as core derives it (ADR 0064). Without
 * `item:read` the items are hidden (ADR 0050 feature scope), not an error.
 */
export async function loadProgramData(): Promise<Result<ProgramFormData>> {
  const [typed, items, bundles, setups, states, customisable, timeZone] = await Promise.all([
    loadTypedFormData({ base: "LINE" }),
    runOperation({ operation: listItems, input: { capability: "BOOKABLE", limit: LIMIT } }),
    runOperation({ operation: listItems, input: { capability: "BUNDLE", limit: LIMIT } }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
    loadStates(),
    loadCustomisableItems(),
    loadOrganizationTimeZone(),
  ]);
  if (!typed.ok) return typed;
  if (!items.ok && items.error.code !== "FORBIDDEN") return items;
  if (!setups.ok) return setups;
  return {
    ok: true,
    value: {
      ...typed.value,
      items: items.ok
        ? items.value.items.map(({ id, name, setups: own, timeZone: zone }) => ({
            ...{ id, name, timeZone: zone },
            setupIds: own.map(({ setupId }) => setupId),
          }))
        : [],
      itemsHidden: !items.ok,
      bundles: bundles.ok
        ? bundles.value.items.map(({ id, name, timeZone: zone }) => ({ id, name, timeZone: zone }))
        : [],
      setups: setups.value.items.map(({ id, name }) => ({ id, name })),
      states,
      customisable,
      timeZone,
    },
  };
}
