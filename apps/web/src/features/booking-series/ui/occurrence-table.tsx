"use client";

import type { BookingSeriesDto } from "@okazi/core";
import type { BookingStatusDto } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { NamedOption } from "@/components/form/named-option";
import { useOccurrenceColumns } from "./use-occurrence-columns";

export type OccurrenceTableProps = {
  series: BookingSeriesDto;
  statuses: BookingStatusDto[];
  rooms: NamedOption[];
};

/** The series' occurrences, each changeable from its row menu while it is still open. */
export function OccurrenceTable({ series, statuses, rooms }: OccurrenceTableProps) {
  const t = useTranslations("bookingSeries");
  const columns = useOccurrenceColumns({
    seriesId: series.id,
    cancelled: series.cancelledAt !== null,
    total: series.occurrences.length,
    statuses,
    rooms,
  });
  return (
    <PersistedDataTable
      tableId="booking-series.occurrences"
      columns={columns}
      data={series.occurrences}
      getRowId={(occurrence) => occurrence.bookingId}
      emptyText={t("noOccurrences")}
    />
  );
}
