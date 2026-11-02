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
  /** The trigger's text and accessible name, e.g. "Actions". */
  label: string;
  /** The dots alone, `label` only for screen readers: for tight spots outside tables (boards). */
  compact?: boolean;
  /** `DropdownMenuItem`s. Every item must have a text label, never an icon alone. */
  children: ReactNode;
};

/** Row actions are always a menu of text items behind a labelled button, never icon-only buttons. */
export function DataTableRowActions({
  label,
  compact = false,
  children,
}: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" aria-label={label}>
            <MoreHorizontalIcon />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <MoreHorizontalIcon aria-hidden />
            {label}
          </Button>
        )}
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

/** The pinned far-right actions column: not sortable, not hideable, as wide as its button. */
export function actionsColumn<TData>({
  label,
  cell,
}: ActionsColumnInput<TData>): ColumnDef<TData, unknown> {
  return {
    id: DATA_TABLE_ACTIONS_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    size: 120,
    header: () => <span className="sr-only">{label}</span>,
    cell: ({ row }) => cell(row.original),
  };
}
