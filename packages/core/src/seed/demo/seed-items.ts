import { ok, type Result } from "../../errors/result";
import { createItem } from "../../features/item/write-operations";
import { setVenueHours } from "../../features/venue/hours-operations";
import { createVenue } from "../../features/venue/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoConfig } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import { seedItemDemands } from "./seed-demands";
import { itemInput } from "./seed-item-input";

export type SeedItemsInput = { context: ExecuteContext; config: DemoConfig; refs: DemoRefs };

/** The org's venue and its catalog by name, for slices that build on the catalog. */
export type DemoCatalog = { venueId: string; items: ReadonlyMap<string, string> };

/**
 * Slices 2–3 of ADR 0025: the org's venue with its opening hours and the items in it (parts after the items they
 * contain), via `venue.create` and `item.create` as SYSTEM, each with its demands (ADR 0059).
 */
export async function seedDemoItems({
  context,
  config,
  refs,
}: SeedItemsInput): Promise<Result<DemoCatalog>> {
  const venue = await execute({ operation: createVenue, input: config.venue, context });
  if (!venue.ok) return venue;
  const hours = { venueId: venue.value.id, ...config.venueHours };
  const opening = await execute({ operation: setVenueHours, input: hours, context });
  if (!opening.ok) return opening;
  const seeded = new Map<string, string>();
  for (const item of config.items) {
    const input = itemInput({ item, refs, venueId: venue.value.id, seeded });
    if (!input.ok) return input;
    const result = await execute({ operation: createItem, input: input.value, context });
    if (!result.ok) return result;
    seeded.set(item.name, result.value.id);
    const demands = await seedItemDemands({ context, item, itemId: result.value.id, refs });
    if (!demands.ok) return demands;
  }
  return ok({ value: { venueId: venue.value.id, items: seeded } });
}
