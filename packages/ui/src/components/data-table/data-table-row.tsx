import { flexRender, type Row } from "@tanstack/react-table";
import { cn } from "../../lib/cn";
import { TableCell, TableRow } from "../table/table";
import { isPinnedColumn } from "./data-table-order";

export type DataTableRowProps<TData> = {
  row: Row<TData>;
  selected: boolean;
  onRowClick?: (row: TData) => void;
};

export function DataTableRow<TData>({ row, selected, onRowClick }: DataTableRowProps<TData>) {
  const clickable = onRowClick !== undefined;
  return (
    <TableRow
      data-state={selected || row.getIsSelected() ? "selected" : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={cn(
        clickable && "cursor-pointer focus-visible:bg-muted focus-visible:outline-none",
      )}
      onClick={() => onRowClick?.(row.original)}
      onKeyDown={(event) => {
        if (!clickable || event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRowClick(row.original);
        }
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          onClick={
            isPinnedColumn({ id: cell.column.id }) ? (event) => event.stopPropagation() : undefined
          }
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
