import "server-only";
import { type ItemDto, listItemStates, listItems, type Result } from "@bibi/core";
import { listAll } from "@/server/list-all";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { loadCustomisableItems } from "./customisable-items";
import type { LineStateOption } from "./ui/line-state-option";
import type { BookableOption, ItemOption, ProgramFormData } from "./ui/program-form-data";

const LIMIT = 100;

/**
 * The organization's item states (a handful per item type). A caller who may not read them sees
 * the lines without states rather than no schedule at all.
 */
async function loadStates(): Promise<LineStateOption[]> {
  const states = await runOperation({ operation: listItemStates, input: { limit: LIMIT } });
  if (!states.ok) return [];
  return states.value.items.map(({ id, name, color, transitionsTo, entityTypeId }) => ({
    id,
    name,
    color,
    transitionsTo,
    entityTypeId,
  }));
}

type TypeInfo = { name: string; bookable: boolean };

/** An item as the picker shows it: its zone, list price and type name. */
const itemOption = ({ item, types }: { item: ItemDto; types: Map<string, TypeInfo> }) => ({
  ...{ id: item.id, name: item.name, timeZone: item.timeZone, entityTypeId: item.entityTypeId },
  ...{ priceMinor: item.priceMinor, priceUnit: item.priceUnit },
  typeName: types.get(item.entityTypeId)?.name,
});

/** Every item split into the bookable ones (with layouts) and the rest (dishes, drinks). */
function splitItems({ items, types }: { items: ItemDto[]; types: Map<string, TypeInfo> }) {
  const bookable: BookableOption[] = [];
  const other: ItemOption[] = [];
  for (const item of items) {
    const option = itemOption({ item, types });
    if (!types.get(item.entityTypeId)?.bookable) {
      other.push(option);
      continue;
    }
    const layouts = item.layouts.map((layout) => ({
      ...{ id: layout.layoutId, name: layout.name },
      capacity: layout.effectiveCapacity,
    }));
    bookable.push({ ...option, layouts });
  }
  return { bookable, other };
}

/**
 * Line types and lists, every item (bookable ones with their layouts, the rest for food and
 * drink lines), bundles, customisable items and item states, with each item's zone as core
 * derives it (ADR 0064). Without `item:read` the items are hidden (ADR 0050 feature scope), not
 * an error.
 */
export async function loadProgramData(): Promise<Result<ProgramFormData>> {
  const [typed, items, bundles, states, customisable, timeZone, itemTypes] = await Promise.all([
    loadTypedFormData({ base: "LINE" }),
    listAll({ operation: listItems, input: {}, maxPages: 5 }),
    runOperation({ operation: listItems, input: { capability: "BUNDLE", limit: LIMIT } }),
    loadStates(),
    loadCustomisableItems(),
    loadOrganizationTimeZone(),
    loadEntityTypesOf({ base: "ITEM" }),
  ]);
  if (!typed.ok) return typed;
  if (!items.ok && items.error.code !== "FORBIDDEN") return items;
  const types = new Map<string, TypeInfo>(
    itemTypes.ok
      ? itemTypes.value.items.map(({ id, name, capabilities }) => [
          id,
          { name, bookable: capabilities.includes("BOOKABLE") },
        ])
      : [],
  );
  const { bookable, other } = items.ok
    ? splitItems({ items: items.value, types })
    : { bookable: [], other: [] };
  return {
    ok: true,
    value: {
      ...typed.value,
      items: bookable,
      otherItems: other,
      itemsHidden: !items.ok,
      bundles: bundles.ok
        ? bundles.value.items.map(({ id, name, timeZone: zone }) => ({ id, name, timeZone: zone }))
        : [],
      states,
      customisable,
      timeZone,
    },
  };
}
