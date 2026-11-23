import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  OccupancyIdInputSchema,
  OccupancyListInputSchema,
  OccupancyListOutputSchema,
  OccupancySchema,
} from "./schema";
import { loadOccupancy, toOccupancyDto } from "./to-occupancy-dto";
import { archiveOccupancy, createOccupancy, updateOccupancy } from "./write-operations";

export const listOccupancies = defineOperation({
  name: "occupancy.list",
  kind: "query",
  description:
    "List when bookable items are occupied (bookings, options, setup time, maintenance, " +
    "internal use), earliest first (newestFirst: latest first). Filter by item, type, a time " +
    "window (from/to) and endsBefore (only periods that have ended).",
  input: OccupancyListInputSchema,
  output: OccupancyListOutputSchema,
  permission: "order:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.occupancy.findMany({
      where: {
        ...(input.itemId ? { itemId: input.itemId } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.from || input.endsBefore
          ? {
              endsAt: {
                ...(input.from ? { gt: input.from } : {}),
                ...(input.endsBefore ? { lte: input.endsBefore } : {}),
              },
            }
          : {}),
        ...(input.to ? { startsAt: { lt: input.to } } : {}),
      },
      orderBy: input.newestFirst
        ? [{ startsAt: "desc" }, { id: "desc" }]
        : [{ startsAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toOccupancyDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getOccupancy = defineOperation({
  name: "occupancy.get",
  kind: "query",
  description: "Get one occupancy of a bookable item by id.",
  input: OccupancyIdInputSchema,
  output: OccupancySchema,
  permission: "order:read",
  handler: async ({ input, context }) => {
    const occupancy = await loadOccupancy({ context, id: input.id });
    return occupancy ? ok({ value: occupancy }) : notFound({ entity: "Occupancy" });
  },
});

export const occupancyOperations = [
  listOccupancies,
  getOccupancy,
  createOccupancy,
  updateOccupancy,
  archiveOccupancy,
];
