import { ok, type Result } from "../../errors/result";
import { createItem } from "../../features/item/write-operations";
import { createVenue } from "../../features/venue/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoConfig } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import { itemInput } from "./seed-item-input";

export type SeedItemsInput = { context: ExecuteContext; config: DemoConfig; refs: DemoRefs };

/** The org's venue and its catalog by name, for slices that build on the catalog. */
export type DemoCatalog = { venueId: string; items: ReadonlyMap<string, string> };

/**
 * Slices 2–3 of ADR 0025: the org's venue and the items in it (parts after the items they
 * contain), via `venue.create` and `item.create` as SYSTEM.
 */
export async function seedDemoItems({
  context,
  config,
  refs,
}: SeedItemsInput): Promise<Result<DemoCatalog>> {
  const venue = await execute({ operation: createVenue, input: config.venue, context });
  if (!venue.ok) return venue;
  const seeded = new Map<string, string>();
  for (const item of config.items) {
    const input = itemInput({ item, refs, venueId: venue.value.id, seeded });
    if (!input.ok) return input;
    const result = await execute({ operation: createItem, input: input.value, context });
    if (!result.ok) return result;
    seeded.set(item.name, result.value.id);
  }
  return ok({ value: { venueId: venue.value.id, items: seeded } });
}
