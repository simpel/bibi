import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { BOOKING_OCCUPANCY_SOURCE, releaseBookingOccupancy } from "../booking/cancellation";
import { hasClash, type OccurrencePeriod, occupyOccurrence } from "./occupy-occurrence";

type Db = { context: Pick<OperationContext, "db"> };

/** The items the booking occupies now (its `BOOKING` occupancy); empty for a clashing one. */
export async function occupiedItemIds({
  context,
  bookingId,
}: Db & { bookingId: string }): Promise<string[]> {
  const rows = await context.db.occupancy.findMany({
    where: { sourceType: BOOKING_OCCUPANCY_SOURCE, sourceId: bookingId, type: "BOOKING" },
    select: { itemId: true },
    orderBy: { createdAt: "asc" },
  });
  return [...new Set(rows.map(({ itemId }) => itemId))];
}

export type ReplaceOccupancyInput = OccurrencePeriod & {
  context: OperationContext;
  bookingId: string;
  itemIds: string[];
  setupId: string | null;
  changeoverMinutes: number;
};

/**
 * Releases what the occurrence occupies and occupies the items for the new period instead.
 * Returns whether it clashes: then nothing is occupied, as when the series was created.
 */
export async function replaceOccupancy({
  context,
  bookingId,
  itemIds,
  setupId,
  changeoverMinutes,
  ...period
}: ReplaceOccupancyInput): Promise<Result<boolean>> {
  const released = await releaseBookingOccupancy({ context, bookingId });
  if (!released.ok) return released;
  if (await hasClash({ context, itemIds, changeoverMinutes, ...period })) {
    return ok({ value: true });
  }
  const occupied = await occupyOccurrence({ context, bookingId, itemIds, setupId, ...period });
  if (!occupied.ok) return occupied;
  return ok({ value: false });
}
