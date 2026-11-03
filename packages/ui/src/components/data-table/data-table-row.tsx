import { flexRender, type Row } from "@tanstack/react-table";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../context-menu/context-menu";
import { TableCell, TableRow } from "../table/table";
import { isPinnedColumn } from "./data-table-order";
import { pinnedCellClass } from "./data-table-pinned";

export type DataTableRowProps<TData> = {
  row: Row<TData>;
  selected: boolean;
  onRowClick?: (row: TData) => void;
  /** The row's right-click menu items; none = the browser's own menu. */
  menu?: (row: TData) => ReactNode;
};

/** A row with a right-click menu when `menu` is given. */
export function DataTableRow<TData>({ menu, ...props }: DataTableRowProps<TData>) {
  if (!menu) return <PlainRow {...props} />;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <PlainRow {...props} />
      </ContextMenuTrigger>
      <ContextMenuContent>{menu(props.row.original)}</ContextMenuContent>
    </ContextMenu>
  );
}

type PlainRowProps<TData> = Omit<DataTableRowProps<TData>, "menu"> & ComponentProps<"tr">;

function PlainRow<TData>({ row, selected, onRowClick, ...rest }: PlainRowProps<TData>) {
  const clickable = onRowClick !== undefined;
  return (
    <TableRow
      {...rest}
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
          className={pinnedCellClass({ id: cell.column.id })}
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
