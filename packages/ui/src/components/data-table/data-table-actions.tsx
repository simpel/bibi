import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import { DATA_TABLE_ACTIONS_COLUMN_ID } from "./data-table-order";
import { DataTableRowAction, type DataTableRowActionProps } from "./data-table-row-action";

export type DataTableRowActionsProps = {
  /** The trigger's accessible name, e.g. "Actions". Never shown as text. */
  label: string;
  /** Primary actions: buttons beside the menu on wide tables, the first items of the menu on narrow ones. */
  primary?: DataTableRowActionProps[];
  /** `DataTableRowActionsProps.compact` kept for tight spots outside tables (boards). */
  compact?: boolean;
  /** `DropdownMenuItem`s. Every item must have a text label, never an icon alone. */
  children?: ReactNode;
};

type RowMenuProps = Pick<DataTableRowActionsProps, "label" | "compact" | "children"> & {
  primary: DataTableRowActionProps[];
  className?: string;
};

/** One dots-only trigger and its menu: the given primary actions first, then the other items. */
function RowMenu({ label, compact, primary, className, children }: RowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={compact ? "ghost" : "outline"}
          size="icon"
          aria-label={label}
          className={cn(!compact && "size-8", className)}
        >
          <MoreHorizontalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {primary.map(({ label: text, onClick, destructive, disabled }) => (
          <DropdownMenuItem
            key={text}
            destructive={destructive}
            disabled={disabled}
            onSelect={onClick}
          >
            {text}
          </DropdownMenuItem>
        ))}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Row actions: primary actions as buttons, the rest in a menu of text items behind a dots-only
 * trigger. Below the `@2xl` container width every action lives in the menu. The menu is portalled
 * out of the container query, so each width gets its own trigger and the container picks one.
 */
export function DataTableRowActions({
  label,
  primary = [],
  compact = false,
  children,
}: DataTableRowActionsProps) {
  const hasMenu = children != null && children !== false;
  const hasPrimary = primary.length > 0;
  if (!hasPrimary)
    return (
      <RowMenu label={label} compact={compact} primary={[]}>
        {children}
      </RowMenu>
    );
  return (
    <span className="flex items-center justify-end gap-1.5">
      <span className="hidden items-center gap-1.5 @2xl:flex">
        {primary.map((action) => (
          <DataTableRowAction key={action.label} {...action} />
        ))}
      </span>
      <RowMenu label={label} compact={compact} primary={primary} className="@2xl:hidden">
        {children}
      </RowMenu>
      {hasMenu ? (
        <RowMenu label={label} compact={compact} primary={[]} className="hidden @2xl:inline-flex">
          {children}
        </RowMenu>
      ) : null}
    </span>
  );
}

export type ActionsColumnInput<TData> = {
  label: string;
  /** `DataTableRowActions` (a menu) or `DataTableRowAction`s in a `DataTableRowActionGroup`. */
  cell: (row: TData) => ReactNode;
};

/** The pinned far-right actions column: sticky to the visible right edge, not sortable or hideable. */
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
