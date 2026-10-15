import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { BOOKING_OCCUPANCY_SOURCE } from "../booking/cancellation";
import { addChangeover } from "../occupancy/add-changeover";
import { toOccupancyDto } from "../occupancy/to-occupancy-dto";

export type OccurrencePeriod = { startsAt: Date; endsAt: Date };

export type HasClashInput = OccurrencePeriod & {
  context: Pick<OperationContext, "db">;
  itemIds: string[];
  changeoverMinutes: number;
};

/**
 * Whether an active non-option occupancy (another booking, setup time or a block) overlaps the
 * occurrence or its changeover on any of the items. Checked before writing, because the
 * exclusion constraint would otherwise abort the whole series transaction.
 */
export async function hasClash({
  context,
  itemIds,
  changeoverMinutes,
  startsAt,
  endsAt,
}: HasClashInput): Promise<boolean> {
  if (itemIds.length === 0) return false;
  const from = new Date(startsAt.getTime() - changeoverMinutes * 60_000);
  const overlapping = await context.db.occupancy.count({
    where: {
      itemId: { in: itemIds },
      type: { not: "OPTION" },
      startsAt: { lt: endsAt },
      endsAt: { gt: from },
    },
  });
  return overlapping > 0;
}

export type OccupyOccurrenceInput = OccurrencePeriod & {
  context: OperationContext;
  bookingId: string;
  itemIds: string[];
  setupId: string | null;
};

/** Occupies every item for the booking (`BOOKING`) and, with a setup, its changeover (`SETUP`). */
export async function occupyOccurrence({
  context,
  bookingId,
  itemIds,
  setupId,
  startsAt,
  endsAt,
}: OccupyOccurrenceInput): Promise<Result<true>> {
  const source = { sourceType: BOOKING_OCCUPANCY_SOURCE, sourceId: bookingId };
  for (const itemId of itemIds) {
    const row = await context.db.occupancy.create({
      data: {
        organizationId: context.organizationId,
        itemId,
        type: "BOOKING",
        startsAt,
        endsAt,
        ...source,
      },
    });
    context.recordChange({
      entityType: "occupancy",
      entityId: row.id,
      after: toOccupancyDto({ row }),
    });
    if (!setupId) continue;
    const changeover = await addChangeover({ context, itemId, setupId, startsAt, ...source });
    if (!changeover.ok) return changeover;
  }
  return ok({ value: true });
}
