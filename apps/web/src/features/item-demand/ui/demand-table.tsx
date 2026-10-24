"use client";

import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { DemandListKind, DemandRow } from "./demand-types";
import { useDemandColumns } from "./use-demand-columns";

export type DemandTableProps = {
  kind: DemandListKind;
  rows: DemandRow[];
  canEdit: boolean;
  emptyText: string;
};

/** One list of the item's demands (Resources or Staffing): its own persisted table per kind. */
export function DemandTable({ kind, rows, canEdit, emptyText }: DemandTableProps) {
  const columns = useDemandColumns({ canEdit });
  return (
    <PersistedDataTable
      tableId={`itemDemand.${kind}`}
      columns={columns}
      data={rows}
      getRowId={(row) => row.demand.id}
      emptyText={emptyText}
    />
  );
}
