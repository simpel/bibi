import type { Booking, Prisma } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { BookingPhase } from "../booking-status/schema";

/** Phases after which an occurrence is left alone by series changes and cancellation. */
export const CLOSED_PHASES: readonly BookingPhase[] = ["CANCELLED", "COMPLETED"];

export type OpenOccurrencesInput = {
  context: Pick<OperationContext, "db">;
  seriesId: string;
  /** Narrows the occurrences, e.g. by `occurrenceIndex` or `startsAt`. */
  where: Prisma.BookingWhereInput;
};

/**
 * The series' active occurrences matching `where` whose status is not in a closed phase
 * (cancelled or completed), in occurrence order.
 */
export async function openOccurrences({
  context,
  seriesId,
  where,
}: OpenOccurrencesInput): Promise<Booking[]> {
  const rows = await context.db.booking.findMany({
    where: { ...where, seriesId },
    orderBy: { occurrenceIndex: "asc" },
  });
  const statuses = await context.db.bookingStatus.findMany({
    // An archived status can still be in use, so it is read too.
    where: {
      id: { in: [...new Set(rows.map((row) => row.bookingStatusId))] },
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    select: { id: true, phase: true },
  });
  const closed = new Set(
    statuses.filter(({ phase }) => CLOSED_PHASES.includes(phase)).map(({ id }) => id),
  );
  return rows.filter((row) => !closed.has(row.bookingStatusId));
}
