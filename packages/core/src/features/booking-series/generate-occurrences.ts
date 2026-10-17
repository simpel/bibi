import type { Booking } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { Occurrence } from "../../recurrence/expand-occurrences-schema";
import { toJson } from "../../shared/to-json";
import { assignOnCreate } from "../assignment/assign-on-create";
import { defaultTentativeStatusId, nextReference } from "../booking/booking-defaults";
import { toBookingDto } from "../booking/to-booking-dto";
import { hasClash, occupyOccurrence } from "./occupy-occurrence";
import type { BookingSeriesTemplate } from "./schema";

export type GenerateOccurrencesInput = {
  context: OperationContext;
  series: { id: string; entityTypeId: string; customerId: string };
  template: BookingSeriesTemplate;
  occurrences: Occurrence[];
  changeoverMinutes: number;
};

/**
 * Creates one ordinary booking per occurrence (ADR 0023) in the default `TENTATIVE` status, with
 * consecutive reference numbers. An occurrence whose items are taken is still created, flagged
 * `clash` and left without occupancy, so a clash never aborts the series.
 */
export async function generateOccurrences({
  context,
  series,
  template: { itemIds, setupId, fields, assigneeId, ...details },
  occurrences,
  changeoverMinutes,
}: GenerateOccurrencesInput): Promise<Result<Booking[]>> {
  const bookingStatusId = await defaultTentativeStatusId({ context });
  if (!bookingStatusId.ok) return bookingStatusId;
  const firstReference = await nextReference({ context });
  const shared = {
    organizationId: context.organizationId,
    entityTypeId: series.entityTypeId,
    customerId: series.customerId,
    bookingStatusId: bookingStatusId.value,
    seriesId: series.id,
    fields: toJson({ value: fields }) ?? {},
    ...details,
  };
  const bookings: Booking[] = [];
  for (const [position, { index, start: startsAt, end: endsAt }] of occurrences.entries()) {
    const period = { startsAt, endsAt };
    const clash = await hasClash({ context, itemIds, changeoverMinutes, ...period });
    const reference = firstReference + position;
    const row = await context.db.booking.create({
      data: { ...shared, reference, occurrenceIndex: index, clash, ...period },
    });
    context.recordChange({ entityType: "booking", entityId: row.id, after: toBookingDto({ row }) });
    await assignOnCreate({ context, subjectType: "BOOKING", subjectId: row.id, assigneeId });
    const place = { context, bookingId: row.id, itemIds, setupId, ...period };
    const occupied = clash ? ok({ value: true }) : await occupyOccurrence(place);
    if (!occupied.ok) return occupied;
    bookings.push(row);
  }
  return ok({ value: bookings });
}
