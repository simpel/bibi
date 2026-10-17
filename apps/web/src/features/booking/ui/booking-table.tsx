"use client";

import type { BookingDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type BookingLookups, useBookingColumns } from "./use-booking-columns";

export type BookingTableProps = BookingLookups & { bookings: BookingDto[] };

/** Booking rows: reference (link), customer, type, salesperson, status and time. */
export function BookingTable({ bookings, ...lookups }: BookingTableProps) {
  const t = useTranslations("booking");
  const columns = useBookingColumns(lookups);
  return (
    <PersistedDataTable
      tableId="booking.list"
      columns={columns}
      data={bookings}
      getRowId={(booking) => booking.id}
      emptyText={t("empty")}
    />
  );
}
