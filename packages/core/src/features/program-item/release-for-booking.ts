import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { releaseProgramItem } from "./reserve";

export type ReleaseForBookingInput = { context: OperationContext; bookingId: string };

/**
 * Releases the occupancy of every active program item of the booking, so a cancelled booking no
 * longer blocks the items its run schedule held. The program items themselves stay as history.
 */
export async function releaseProgramItemsOfBooking({
  context,
  bookingId,
}: ReleaseForBookingInput): Promise<Result<true>> {
  const rows = await context.db.programItem.findMany({
    where: { bookingId },
    select: { id: true },
  });
  for (const { id } of rows) {
    const released = await releaseProgramItem({ context, id });
    if (!released.ok) return released;
  }
  return ok({ value: true });
}
