import type { SeriesOccurrenceDto } from "@okazi/core";
import type { BookingStatusDto } from "@okazi/core/schemas";

export type IsOccurrenceEditableInput = {
  cancelled: boolean;
  statuses: readonly BookingStatusDto[];
  occurrence: SeriesOccurrenceDto;
};

/** A running series' occurrence that is not cancelled or completed can still be changed. */
export function isOccurrenceEditable({
  cancelled,
  statuses,
  occurrence,
}: IsOccurrenceEditableInput): boolean {
  const status = statuses.find(({ id }) => id === occurrence.bookingStatusId);
  return !cancelled && !["CANCELLED", "COMPLETED"].includes(status?.phase ?? "");
}
