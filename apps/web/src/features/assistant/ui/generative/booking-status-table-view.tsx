"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useBookingStatusViewColumns } from "./use-booking-status-view-columns";

export type BookingStatusTableViewProps = GenerativeProps<"booking-status-table">;

/** Booking statuses in order; names link to the booking statuses settings page. */
export function BookingStatusTableView({ items, nextCursor }: BookingStatusTableViewProps) {
  const t = useTranslations("assistant.ui.bookingStatus");
  const columns = useBookingStatusViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="booking-status-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="booking-status.assistant"
        columns={columns}
        data={items}
        getRowId={(status) => status.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
