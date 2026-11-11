import { ok, type Result } from "../../errors/result";
import type { PriceEffect } from "../../features/item/customisation-group-schema";
import type { DemoItem, DemoPart } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import { missing, resolveFields } from "./seed-fields";

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
  split: boolean;
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
    const split = group.split ?? false;
    groups.push({
      name: group.name,
      minPick: group.minPick ?? pick,
      maxPick: pick,
      split,
      options,
    });
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

/** ADR 0103: the room's people limit, its own or its largest layout's capacity. */
const peopleLimit = ({ item }: { item: DemoItem }) => {
  const largest = Math.max(0, ...Object.values(item.layouts ?? {}));
  const maxPeople = item.maxPeople ?? (largest > 0 ? largest : undefined);
  return maxPeople === undefined ? {} : { maxPeople };
};

/** `item.create` (or `item.saveAsBundle`) input for one demo item, with names resolved to ids. */
export function itemInput({ item, refs, venueId, seeded }: ItemInputArgs) {
  const type = refs.itemTypes.get(item.type);
  if (!type) return missing({ what: `item type ${item.type}` });
  const fields = resolveFields({ fields: item.fields, type });
  if (!fields.ok) return fields;
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
      ...peopleLimit({ item }),
      ...(parts.length ? { parts } : {}),
      ...(customisationGroups.length ? { customisationGroups } : {}),
    },
  });
}
