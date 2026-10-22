"use client";

import type { OccupancyDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useOccupancyColumns } from "./use-occupancy-columns";

export type OccupancyTableProps = { occupancies: OccupancyDto[]; access: RowAccess };

/** Occupancy rows: type, note and period; manual blocks can be edited and released. */
export function OccupancyTable({ occupancies, access }: OccupancyTableProps) {
  const t = useTranslations("occupancy");
  const columns = useOccupancyColumns({ access });
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
