import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { OccupancyDto } from "./schema";
import { toOccupancyDto } from "./to-occupancy-dto";

export type AddChangeoverInput = {
  context: OperationContext;
  itemId: string;
  setupId: string;
  /** Start of the period the item is set up for; the changeover ends here. */
  startsAt: Date;
  /** The record the changeover belongs to, e.g. a ticket line. */
  sourceType: string;
  sourceId: string;
};

/**
 * Occupies the item with a `SETUP` period of the setup's changeover time right before
 * `startsAt` (ADR 0022). Returns null when the setup needs no changeover. An overlap with another
 * occupancy other than a soft hold is rejected by the database and surfaces as `CONFLICT`.
 */
export async function addChangeover({
  context,
  itemId,
  setupId,
  startsAt,
  sourceType,
  sourceId,
}: AddChangeoverInput): Promise<Result<OccupancyDto | null>> {
  const setup = await context.db.setup.findFirst({ where: { id: setupId } });
  if (!setup) {
    const message = "Unknown setup";
    return invalid({ message, issues: [{ path: "setupId", message }] });
  }
  if (setup.changeoverMinutes <= 0) return ok({ value: null });
  const row = await context.db.occupancy.create({
    data: {
      organizationId: context.organizationId,
      itemId,
      type: "SETUP",
      startsAt: new Date(startsAt.getTime() - setup.changeoverMinutes * 60_000),
      endsAt: startsAt,
      sourceType,
      sourceId,
    },
  });
  const occupancy = toOccupancyDto({ row });
  context.recordChange({ entityType: "occupancy", entityId: row.id, after: occupancy });
  return ok({ value: occupancy });
}
