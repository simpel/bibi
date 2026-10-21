import { ok, type Result } from "../../errors/result";
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

type Composition = { parts: Part[]; customisationGroups: ItemCustomisationGroup[] };
type ItemCustomisationGroup = { name: string; minPick: number; maxPick: number; itemIds: string[] };
type CompositionInput = { item: DemoItem; seeded: ReadonlyMap<string, string> };

/** Mandatory parts plus every customisation group's options as parts, and the groups over them. */
function resolveComposition({ item, seeded }: CompositionInput): Result<Composition> {
  const parts = resolveParts({ parts: item.parts ?? [], seeded });
  if (!parts.ok) return parts;
  const customisationGroups: ItemCustomisationGroup[] = [];
  for (const group of item.customisations ?? []) {
    const options = resolveParts({ parts: group.options, seeded });
    if (!options.ok) return options;
    parts.value.push(...options.value);
    const pick = group.pick ?? 1;
    const itemIds = options.value.map((option) => option.itemId);
    customisationGroups.push({ name: group.name, minPick: pick, maxPick: pick, itemIds });
  }
  return ok({ value: { parts: parts.value, customisationGroups } });
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
  const composition = resolveComposition({ item, seeded });
  if (!composition.ok) return composition;
  const { parts, customisationGroups } = composition.value;
  return ok({
    value: {
      ...{ entityTypeId: type.id, venueId, name: item.name, fields: fields.value },
      ...(item.priceKr === undefined ? {} : { priceMinor: Math.round(item.priceKr * 100) }),
      ...(item.priceUnit ? { priceUnit: item.priceUnit } : {}),
      ...(item.durationMinutes ? { defaultDurationMinutes: item.durationMinutes } : {}),
      ...{ setupMinutes: item.setupMinutes ?? null, teardownMinutes: item.teardownMinutes ?? null },
      ...(setups.value.length ? { setups: setups.value } : {}),
      ...(parts.length ? { parts } : {}),
      ...(customisationGroups.length ? { customisationGroups } : {}),
    },
  });
}
