"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useBookingViewColumns } from "./use-booking-view-columns";

export type BookingTableViewProps = GenerativeProps<"booking-table">;

/** A page of bookings; each reference links to the booking page. */
export function BookingTableView({ items, nextCursor }: BookingTableViewProps) {
  const t = useTranslations("assistant.ui.booking");
  const columns = useBookingViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="booking-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="booking.assistant"
        columns={columns}
        data={items}
        getRowId={(booking) => booking.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
