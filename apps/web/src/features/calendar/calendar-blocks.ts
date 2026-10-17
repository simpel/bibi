import type { BookingDto, OccupancyDto, OccupancyType, ProgramItemDto } from "@okazi/core/schemas";
import { optionQueuePositions } from "./option-queue";

/** One occupancy on the calendar, with the booking it belongs to (when it has one). */
export type CalendarBlock = {
  id: string;
  itemId: string;
  type: OccupancyType;
  startsAt: Date;
  endsAt: Date;
  bookingId: string | null;
  reference: number | null;
  seriesId: string | null;
  occurrenceIndex: number | null;
  /** The program item's name, or the note of a manual block. */
  title: string | null;
  /** 1 = first option, 2 = second… Only for `OPTION`. */
  queuePosition: number | null;
};

export type ToCalendarBlocksInput = {
  occupancies: OccupancyDto[];
  programItems: ProgramItemDto[];
  bookings: BookingDto[];
  /** `Occupancy.sourceType` values: a booking's own rows and a program item's rows. */
  sources: { booking: string; programItem: string };
};

/**
 * Joins occupancies with their source: a program item's rows (and its setup time) belong to
 * the program item's booking, a booking's own rows (series occurrences) to that booking.
 */
export function toCalendarBlocks({
  occupancies,
  programItems,
  bookings,
  sources,
}: ToCalendarBlocksInput): CalendarBlock[] {
  const programById = new Map(programItems.map((item) => [item.id, item]));
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const queue = optionQueuePositions({ occupancies });
  return occupancies.map((occupancy) => {
    const program =
      occupancy.sourceType === sources.programItem && occupancy.sourceId
        ? programById.get(occupancy.sourceId)
        : undefined;
    const ownBooking = occupancy.sourceType === sources.booking ? occupancy.sourceId : null;
    const bookingId = program?.bookingId ?? ownBooking ?? null;
    const booking = bookingId ? bookingById.get(bookingId) : undefined;
    return {
      id: occupancy.id,
      itemId: occupancy.itemId,
      type: occupancy.type,
      startsAt: occupancy.startsAt,
      endsAt: occupancy.endsAt,
      bookingId,
      reference: booking?.reference ?? null,
      seriesId: booking?.seriesId ?? null,
      occurrenceIndex: booking?.occurrenceIndex ?? null,
      title: program?.name ?? occupancy.note,
      queuePosition: queue.get(occupancy.id) ?? null,
    };
  });
}
