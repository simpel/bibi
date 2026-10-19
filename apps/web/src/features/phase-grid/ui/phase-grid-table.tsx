"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GridData } from "../load-grid-data";
import { toGridRows } from "./grid-rows";
import { useGridColumns } from "./use-grid-columns";

export type PhaseGridTableProps = GridData & { canEdit: boolean };

/** Phases down, item types across; a terminal phase releases every line, so it has no cells. */
export function PhaseGridTable({ phases, types, cells, canEdit }: PhaseGridTableProps) {
  const t = useTranslations("phaseGrid");
  const columns = useGridColumns({ types, canEdit });
  const rows = useMemo(
    () => toGridRows({ phases, typeIds: types.map(({ type }) => type.id), cells }),
    [phases, types, cells],
  );
  return (
    <PersistedDataTable
      tableId="phase-grid.edit"
      columns={columns}
      data={rows}
      getRowId={(row) => row.phase.id}
      emptyText={t("empty")}
    />
  );
}
