import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../checkbox/checkbox";
import { DATA_TABLE_SELECT_COLUMN_ID } from "./data-table-order";
import type { DataTableTextLabels } from "./data-table-types";

/** The pinned far-left checkbox column. Select all applies to the rows on the current page. */
export function selectColumn<TData>({
  labels,
}: {
  labels: DataTableTextLabels;
}): ColumnDef<TData, unknown> {
  return {
    id: DATA_TABLE_SELECT_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.selectAll}
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.selectRow}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value === true)}
      />
    ),
  };
}
