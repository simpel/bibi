"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useBookingSeriesViewColumns } from "./use-booking-series-view-columns";

export type BookingSeriesTableViewProps = GenerativeProps<"booking-series-table">;

/** A page of series; each rule links to the series page. */
export function BookingSeriesTableView({ items, nextCursor }: BookingSeriesTableViewProps) {
  const t = useTranslations("assistant.ui.bookingSeries");
  const columns = useBookingSeriesViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="booking-series-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="booking-series.assistant"
        columns={columns}
        data={items}
        getRowId={(series) => series.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
