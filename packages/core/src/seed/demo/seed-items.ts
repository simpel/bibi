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

export type SeedItemsInput = { context: ExecuteContext; config: DemoConfig; refs: DemoRefs };

/** The org's venue and the items in it, via `venue.create` and `item.create` as SYSTEM. */
export async function seedDemoItems({
  context,
  config,
  refs,
}: SeedItemsInput): Promise<Result<true>> {
  const venue = await execute({ operation: createVenue, input: config.venue, context });
  if (!venue.ok) return venue;
  for (const item of config.items) {
    const type = refs.itemTypes.get(item.type);
    if (!type) return missing({ what: `item type ${item.type}` });
    const fields = resolveFields({ item, type });
    if (!fields.ok) return fields;
    const setups = resolveSetups({ item, refs });
    if (!setups.ok) return setups;
    const input = {
      ...{ entityTypeId: type.id, venueId: venue.value.id, name: item.name, fields: fields.value },
      ...(item.priceKr === undefined ? {} : { priceMinor: Math.round(item.priceKr * 100) }),
      ...(item.priceUnit ? { priceUnit: item.priceUnit } : {}),
      ...(setups.value.length ? { setups: setups.value } : {}),
    };
    const result = await execute({ operation: createItem, input, context });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
