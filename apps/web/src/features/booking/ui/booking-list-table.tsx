import type { BookingDto } from "@okazi/core";
import type { BookingFormData } from "./booking-form-data";
import { BookingTable } from "./booking-table";

export type BookingListTableProps = {
  bookings: BookingDto[];
  data: BookingFormData;
};

/** Hands the client table only what it shows (plain lookups, no form schemas or Maps). */
export function BookingListTable({ bookings, data }: BookingListTableProps) {
  return (
    <BookingTable
      bookings={bookings}
      customers={data.customers}
      types={data.types.map(({ id, name }) => ({ id, name }))}
      statuses={data.statuses}
    />
  );
}
