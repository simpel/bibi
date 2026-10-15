import type { OperationContext } from "../../operations/types";
import { BOOKING_PHASES, type BookingPhase } from "./schema";

export type PlaceStatusInput = { context: Pick<OperationContext, "db">; phase: BookingPhase };

/**
 * The position for a new status: after the last status of its phase, else before the first
 * status of a later phase, else last. Statuses at or after it move down one step.
 */
export async function placeStatus({ context, phase }: PlaceStatusInput): Promise<number> {
  const { db } = context;
  const later = BOOKING_PHASES.slice(BOOKING_PHASES.indexOf(phase) + 1);
  const lastInPhase = await db.bookingStatus.findFirst({
    where: { phase },
    orderBy: { position: "desc" },
  });
  const firstLater = lastInPhase
    ? null
    : await db.bookingStatus.findFirst({
        where: { phase: { in: [...later] } },
        orderBy: { position: "asc" },
      });
  if (!lastInPhase && !firstLater) {
    const last = await db.bookingStatus.findFirst({ orderBy: { position: "desc" } });
    return last ? last.position + 1 : 0;
  }
  const position = lastInPhase ? lastInPhase.position + 1 : (firstLater?.position ?? 0);
  await db.bookingStatus.updateMany({
    where: { position: { gte: position } },
    data: { position: { increment: 1 } },
  });
  return position;
}
