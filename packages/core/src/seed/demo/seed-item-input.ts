import { ok, type Result } from "../../errors/result";
import type { PriceEffect } from "../../features/item/customisation-group-schema";
import type { DemoItem, DemoPart } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import { missing, resolveFields } from "./seed-fields";

type SetupsInput = { item: DemoItem; refs: DemoRefs };

function resolveSetups({
  item,
  refs,
}: SetupsInput): Result<{ setupId: string; capacity: number }[]> {
  const setups = [];
  for (const [name, capacity] of Object.entries(item.setups ?? {})) {
    const setupId = refs.setups.get(name);
    if (!setupId) return missing({ what: `setup ${name}` });
    setups.push({ setupId, capacity });
  }
  return ok({ value: setups });
}

type Part = {
  itemId: string;
  quantity: number;
  offsetMinutes: number;
  durationMinutes: number | null;
  required: boolean;
};
type PartsInput = { parts: readonly DemoPart[]; seeded: ReadonlyMap<string, string> };

/** Part names → ids of items seeded earlier in the same org. */
function resolveParts({ parts, seeded }: PartsInput): Result<Part[]> {
  const resolved: Part[] = [];
  for (const part of parts) {
    const itemId = seeded.get(part.name);
    if (!itemId) return missing({ what: `part ${part.name}` });
    resolved.push({
      itemId,
      quantity: part.quantity ?? 1,
      offsetMinutes: part.offsetMinutes ?? 0,
      durationMinutes: part.durationMinutes ?? null,
      required: part.required ?? true,
    });
  }
  return ok({ value: resolved });
}

type Group = {
  name: string;
  minPick: number;
  maxPick: number;
  options: { itemId: string; priceEffect: PriceEffect }[];
};
type GroupsInput = { item: DemoItem; seeded: ReadonlyMap<string, string> };

/** Every customisation group with its option names resolved to ids (ADR 0059). */
function resolveGroups({ item, seeded }: GroupsInput): Result<Group[]> {
  const groups: Group[] = [];
  for (const group of item.customisations ?? []) {
    const options = [];
    for (const option of group.options) {
      const itemId = seeded.get(option.name);
      if (!itemId) return missing({ what: `option ${option.name}` });
      options.push({ itemId, priceEffect: option.priceEffect ?? "INCLUDED" });
    }
    const pick = group.pick ?? 1;
    groups.push({ name: group.name, minPick: group.minPick ?? pick, maxPick: pick, options });
  }
  return ok({ value: groups });
}

export type ItemInputArgs = {
  item: DemoItem;
  refs: DemoRefs;
  venueId: string;
  /** Names → ids of the items seeded so far in the org. */
  seeded: ReadonlyMap<string, string>;
};

/** `item.create` (or `item.saveAsBundle`) input for one demo item, with names resolved to ids. */
export function itemInput({ item, refs, venueId, seeded }: ItemInputArgs) {
  const type = refs.itemTypes.get(item.type);
  if (!type) return missing({ what: `item type ${item.type}` });
  const fields = resolveFields({ fields: item.fields, type });
  if (!fields.ok) return fields;
  const setups = resolveSetups({ item, refs });
  if (!setups.ok) return setups;
  const resolved = resolveParts({ parts: item.parts ?? [], seeded });
  if (!resolved.ok) return resolved;
  const groups = resolveGroups({ item, seeded });
  if (!groups.ok) return groups;
  const [parts, customisationGroups] = [resolved.value, groups.value];
  return ok({
    value: {
      ...{ entityTypeId: type.id, venueId, name: item.name, fields: fields.value },
      ...(item.priceKr === undefined ? {} : { priceMinor: Math.round(item.priceKr * 100) }),
      ...(item.priceUnit ? { priceUnit: item.priceUnit } : {}),
      ...(item.vatRatePercent === undefined ? {} : { vatRatePercent: item.vatRatePercent }),
      ...(item.durationMinutes ? { defaultDurationMinutes: item.durationMinutes } : {}),
      ...{ setupMinutes: item.setupMinutes ?? null, teardownMinutes: item.teardownMinutes ?? null },
      ...(setups.value.length ? { setups: setups.value } : {}),
      ...(parts.length ? { parts } : {}),
      ...(customisationGroups.length ? { customisationGroups } : {}),
    },
  });
}
