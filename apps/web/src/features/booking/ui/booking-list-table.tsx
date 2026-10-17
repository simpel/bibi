import type { BookingDto } from "@okazi/core";
import type { BookingFormData } from "./booking-form-data";
import { BookingTable } from "./booking-table";

export type BookingListTableProps = {
  bookings: BookingDto[];
  data: BookingFormData;
  seriesTotals: Map<string, number>;
};

/** Hands the client table only what it shows (plain lookups, no form schemas or Maps). */
export function BookingListTable({ bookings, data, seriesTotals }: BookingListTableProps) {
  return (
    <BookingTable
      bookings={bookings}
      customers={data.customers}
      members={data.members}
      types={data.types.map(({ id, name }) => ({ id, name }))}
      statuses={data.statuses}
      seriesTotals={Object.fromEntries(seriesTotals)}
    />
  );
}
