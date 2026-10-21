import { defineOperation } from "../../operations/define-operation";
import { checkReadable } from "../ticket/ticket-rules";
import { poolFreeUnits } from "./pool-free-units";
import { PoolFreeUnitsInputSchema, PoolFreeUnitsOutputSchema } from "./pool-schema";

export const freeUnits = defineOperation({
  name: "item.freeUnits",
  kind: "query",
  description:
    "List the free units of a target for a time window (ADR 0059): a target is one specific " +
    "bookable item (itemId) or a pool (entityTypeId plus tagValueIds, the list values every " +
    "unit must carry). A unit is free when no hard hold, buffer or manual block overlaps the " +
    "window; soft holds do not count. Units come in a fixed order (name, then id) and " +
    "prepickId is the first free one. Use this, never your own reasoning over occupancy_list, " +
    "to pick a unit for a booking.",
  input: PoolFreeUnitsInputSchema,
  output: PoolFreeUnitsOutputSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const readable = checkReadable({ context, permission: "ticket:read", path: "startsAt" });
    if (!readable.ok) return readable;
    return poolFreeUnits({ context, input });
  },
});
