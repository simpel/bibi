"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GridData } from "../load-grid-data";
import { toGridRows } from "./grid-rows";
import { useGridColumns } from "./use-grid-columns";

export type StatusGridTableProps = GridData & { canEdit: boolean };

/** Statuses down, item types across; a closing status releases every line, so it has no cells. */
export function StatusGridTable({ statuses, types, cells, canEdit }: StatusGridTableProps) {
  const t = useTranslations("statusGrid");
  const columns = useGridColumns({ types, canEdit });
  const rows = useMemo(
    () => toGridRows({ statuses, typeIds: types.map(({ type }) => type.id), cells }),
    [statuses, types, cells],
  );
  return (
    <PersistedDataTable
      tableId="status-grid.edit"
      columns={columns}
      data={rows}
      getRowId={(row) => row.ticketStatus.id}
      emptyText={t("empty")}
    />
  );
}
