import type { Booking, BookingSeries, Prisma } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { RecurrenceRule } from "../../recurrence/recurrence-rule-schema";
import { serializeRecurrenceRule } from "../../recurrence/rrule-string-schema";
import type { BookingSeriesDto, BookingSeriesTemplate, SeriesOccurrenceDto } from "./schema";

/** The series row with its bookings, every status included (an occurrence stays in its series). */
export type SeriesRow = BookingSeries & { bookings: Booking[] };

export const toSeriesOccurrence = ({ row }: { row: Booking }): SeriesOccurrenceDto => ({
  bookingId: row.id,
  reference: row.reference,
  occurrenceIndex: row.occurrenceIndex ?? 0,
  startsAt: row.startsAt,
  endsAt: row.endsAt,
  bookingStatusId: row.bookingStatusId,
  clash: row.clash,
});

export type ToBookingSeriesDtoInput = { row: SeriesRow };

export function toBookingSeriesDto({ row }: ToBookingSeriesDtoInput): BookingSeriesDto {
  const { bookings, rule, template, ...series } = row;
  const occurrences = bookings
    .map((booking) => toSeriesOccurrence({ row: booking }))
    .sort((a, b) => a.occurrenceIndex - b.occurrenceIndex);
  return {
    ...series,
    rule: serializeRecurrenceRule({ rule: rule as RecurrenceRule }),
    template: template as BookingSeriesTemplate,
    occurrences,
    clashes: occurrences.filter((occurrence) => occurrence.clash),
  };
}

/** Prisma `include` that loads every occurrence, archived ones too. */
export const WITH_OCCURRENCES = {
  bookings: {
    where: { status: { in: ["ACTIVE", "ARCHIVED"] } },
    orderBy: { occurrenceIndex: "asc" },
  },
} satisfies Prisma.BookingSeriesInclude;

export type LoadBookingSeriesInput = { context: Pick<OperationContext, "db">; id: string };

/** The active series with its occurrences, or null when missing, archived or in another org. */
export async function loadBookingSeries({
  context,
  id,
}: LoadBookingSeriesInput): Promise<BookingSeriesDto | null> {
  const row = await context.db.bookingSeries.findFirst({
    where: { id },
    include: WITH_OCCURRENCES,
  });
  return row ? toBookingSeriesDto({ row }) : null;
}
