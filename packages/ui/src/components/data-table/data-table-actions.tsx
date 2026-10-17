import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import { DATA_TABLE_ACTIONS_COLUMN_ID } from "./data-table-order";

export type DataTableRowActionsProps = {
  /** Accessible name of the trigger button, e.g. "Actions". */
  label: string;
  /** `DropdownMenuItem`s. Every item must have a text label, never an icon alone. */
  children: ReactNode;
};

/** Row actions are always a menu of text items, never icon-only action buttons. */
export function DataTableRowActions({ label, children }: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export type ActionsColumnInput<TData> = {
  label: string;
  /** Usually `<DataTableRowActions label={label}>...</DataTableRowActions>`. */
  cell: (row: TData) => ReactNode;
};

/** The pinned far-right actions column: not sortable, not hideable, narrow. */
export function actionsColumn<TData>({
  label,
  cell,
}: ActionsColumnInput<TData>): ColumnDef<TData, unknown> {
  return {
    id: DATA_TABLE_ACTIONS_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    size: 48,
    header: () => <span className="sr-only">{label}</span>,
    cell: ({ row }) => cell(row.original),
  };
}
