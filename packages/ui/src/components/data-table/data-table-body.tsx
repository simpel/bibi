import type { Row } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow } from "../table/table";
import { DataTableRow } from "./data-table-row";

export type DataTableBodyProps<TData> = {
  rows: Row<TData>[];
  columnCount: number;
  emptyText: string;
  onRowClick?: (row: TData) => void;
  selectedRowId?: string;
};

export function DataTableBody<TData>(props: DataTableBodyProps<TData>) {
  if (props.rows.length === 0) {
    return (
      <TableBody>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={props.columnCount} className="h-24 text-center text-muted-foreground">
            {props.emptyText}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  return (
    <TableBody>
      {props.rows.map((row) => (
        <DataTableRow
          key={row.id}
          row={row}
          selected={row.id === props.selectedRowId}
          onRowClick={props.onRowClick}
        />
      ))}
    </TableBody>
  );
}
