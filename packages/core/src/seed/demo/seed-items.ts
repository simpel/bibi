import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createItem } from "../../features/item/write-operations";
import { createVenue } from "../../features/venue/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoConfig, DemoItem } from "./config-types";
import type { DemoRefs, TypeRef } from "./demo-refs";

const missing = ({ what }: { what: string }) =>
  err({
    error: new AppError({ code: "INTERNAL", message: `Demo data refers to unknown ${what}` }),
  });

type ResolveInput = { item: DemoItem; type: TypeRef };

/** Field names → keys and value names → list value ids, as the operations expect. */
function resolveFields({ item, type }: ResolveInput): Result<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};
  for (const [name, raw] of Object.entries(item.fields ?? {})) {
    const field = type.fields.get(name);
    if (!field) return missing({ what: `field ${name}` });
    const names = typeof raw === "string" ? [raw] : Array.isArray(raw) ? raw : null;
    const ids = names?.map((value) => field.values?.get(value) ?? value);
    fields[field.key] = ids ? (Array.isArray(raw) ? ids : ids[0]) : raw;
  }
  return ok({ value: fields });
}

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
type PartsInput = { item: DemoItem; seeded: ReadonlyMap<string, string> };

/** Part names → ids of items seeded earlier in the same org. */
function resolveParts({ item, seeded }: PartsInput): Result<Part[]> {
  const parts: Part[] = [];
  for (const part of item.parts ?? []) {
    const itemId = seeded.get(part.name);
    if (!itemId) return missing({ what: `part ${part.name}` });
    parts.push({
      itemId,
      quantity: part.quantity ?? 1,
      offsetMinutes: part.offsetMinutes ?? 0,
      durationMinutes: part.durationMinutes ?? null,
      required: part.required ?? true,
    });
  }
  return ok({ value: parts });
}

type ItemInputArgs = SeedItemsInput & { item: DemoItem; venueId: string };

/** `item.create` input for one demo item, with names resolved to ids. */
function itemInput({ item, refs, venueId, seeded }: ItemInputArgs & PartsInput) {
  const type = refs.itemTypes.get(item.type);
  if (!type) return missing({ what: `item type ${item.type}` });
  const fields = resolveFields({ item, type });
  if (!fields.ok) return fields;
  const setups = resolveSetups({ item, refs });
  if (!setups.ok) return setups;
  const parts = resolveParts({ item, seeded });
  if (!parts.ok) return parts;
  return ok({
    value: {
      ...{ entityTypeId: type.id, venueId, name: item.name, fields: fields.value },
      ...(item.priceKr === undefined ? {} : { priceMinor: Math.round(item.priceKr * 100) }),
      ...(item.priceUnit ? { priceUnit: item.priceUnit } : {}),
      ...(setups.value.length ? { setups: setups.value } : {}),
      ...(parts.value.length ? { components: parts.value } : {}),
    },
  });
}

export type SeedItemsInput = { context: ExecuteContext; config: DemoConfig; refs: DemoRefs };

/** The org's venue and the items in it (parts after the items they contain), via `venue.create` and `item.create` as SYSTEM. */
export async function seedDemoItems({
  context,
  config,
  refs,
}: SeedItemsInput): Promise<Result<true>> {
  const venue = await execute({ operation: createVenue, input: config.venue, context });
  if (!venue.ok) return venue;
  const seeded = new Map<string, string>();
  for (const item of config.items) {
    const input = itemInput({ context, config, refs, item, venueId: venue.value.id, seeded });
    if (!input.ok) return input;
    const result = await execute({ operation: createItem, input: input.value, context });
    if (!result.ok) return result;
    seeded.set(item.name, result.value.id);
  }
  return ok({ value: true });
}
