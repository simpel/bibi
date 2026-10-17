"use client";

import type { BookingSeriesDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { NamedOption } from "@/components/form/named-option";
import { useSeriesColumns } from "./use-series-columns";

export type BookingSeriesTableProps = { series: BookingSeriesDto[]; customers: NamedOption[] };

/** Series rows: rule (link), customer, clashes, first start and occurrence count. */
export function BookingSeriesTable({ series, customers }: BookingSeriesTableProps) {
  const t = useTranslations("bookingSeries");
  const columns = useSeriesColumns({ customers });
  return (
    <PersistedDataTable
      tableId="booking-series.list"
      columns={columns}
      data={series}
      getRowId={(row) => row.id}
      emptyText={t("empty")}
    />
  );
}
