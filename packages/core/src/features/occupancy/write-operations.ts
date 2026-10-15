import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkBookable, checkManual, checkPeriod } from "./occupancy-rules";
import {
  OccupancyCreateInputSchema,
  OccupancyIdInputSchema,
  OccupancySchema,
  OccupancyUpdateInputSchema,
} from "./schema";
import { loadOccupancy, toOccupancyDto } from "./to-occupancy-dto";

const OVERLAP_NOTE = "Overlapping a booking, setup time or another block gives CONFLICT.";

export const createOccupancy = defineOperation({
  name: "occupancy.create",
  kind: "command",
  description:
    "Block a bookable item for a period: MAINTENANCE (out of service) or INTERNAL (own use). " +
    OVERLAP_NOTE,
  input: OccupancyCreateInputSchema,
  output: OccupancySchema,
  permission: "occupancy:write",
  handler: async ({ input, context }) => {
    const bookable = await checkBookable({ context, itemId: input.itemId });
    if (!bookable.ok) return bookable;
    const period = checkPeriod(input);
    if (!period.ok) return period;
    const row = await context.db.occupancy.create({
      data: { ...input, organizationId: context.organizationId },
    });
    const occupancy = toOccupancyDto({ row });
    context.recordChange({ entityId: row.id, after: occupancy });
    return ok({ value: occupancy });
  },
});

export const updateOccupancy = defineOperation({
  name: "occupancy.update",
  kind: "command",
  description:
    "Change a MAINTENANCE or INTERNAL block: type, period or note. Omitted properties are " +
    `unchanged. ${OVERLAP_NOTE}`,
  input: OccupancyUpdateInputSchema,
  output: OccupancySchema,
  permission: "occupancy:write",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await loadOccupancy({ context, id });
    if (!before) return notFound({ entity: "Occupancy" });
    const manual = checkManual(before);
    if (!manual.ok) return manual;
    const period = checkPeriod({
      startsAt: data.startsAt ?? before.startsAt,
      endsAt: data.endsAt ?? before.endsAt,
    });
    if (!period.ok) return period;
    const row = await context.db.occupancy.update({ where: { id }, data });
    const occupancy = toOccupancyDto({ row });
    context.recordChange({ entityId: id, before, after: occupancy });
    return ok({ value: occupancy });
  },
});

export const archiveOccupancy = defineOperation({
  name: "occupancy.archive",
  kind: "command",
  description: "Release a MAINTENANCE or INTERNAL block so the item can be booked again.",
  input: OccupancyIdInputSchema,
  output: OccupancySchema,
  permission: "occupancy:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadOccupancy({ context, id });
    if (!before) return notFound({ entity: "Occupancy" });
    const manual = checkManual(before);
    if (!manual.ok) return manual;
    const row = await context.db.occupancy.update({ where: { id }, data: { status: "ARCHIVED" } });
    const occupancy = toOccupancyDto({ row });
    context.recordChange({ entityId: id, before, after: occupancy });
    return ok({ value: occupancy });
  },
});
