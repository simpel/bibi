"use client";

import type { OccupancyDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useOccupancyColumns } from "./use-occupancy-columns";

export type OccupancyTableProps = { occupancies: OccupancyDto[]; canWrite: boolean };

/** Occupancy rows: type, note and period; manual blocks can be edited and released. */
export function OccupancyTable({ occupancies, canWrite }: OccupancyTableProps) {
  const t = useTranslations("occupancy");
  const columns = useOccupancyColumns({ canWrite });
  return (
    <PersistedDataTable
      tableId="occupancy.list"
      columns={columns}
      data={occupancies}
      getRowId={(occupancy) => occupancy.id}
      emptyText={t("empty")}
    />
  );
}
