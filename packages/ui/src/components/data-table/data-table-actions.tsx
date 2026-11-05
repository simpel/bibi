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
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";
import { DATA_TABLE_ACTIONS_COLUMN_ID } from "./data-table-order";
import { DataTableRowAction, type DataTableRowActionProps } from "./data-table-row-action";

export type { DataTableRowActionProps };

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
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant={compact ? "ghost" : "outline"}
              size="icon"
              aria-label={label}
              className={cn(!compact && "size-8 shrink-0", className)}
            >
              <MoreHorizontalIcon aria-hidden className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
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
 * The unified row actions component: all actions rendered as icon-only buttons with shadcn tooltips,
 * plus an optional overflow menu behind a dots-only trigger. Inline text labels are never shown on buttons.
 */
export function DataTableRowActions({
  label,
  primary = [],
  compact = false,
  children,
}: DataTableRowActionsProps) {
  const hasMenu = children != null && children !== false;
  const [only] = primary;
  if (primary.length === 1 && only && !hasMenu) return <DataTableRowAction {...only} />;
  if (primary.length === 0)
    return (
      <RowMenu label={label} compact={compact} primary={[]}>
        {children}
      </RowMenu>
    );
  return (
    <span className="flex items-center justify-end gap-1.5">
      {primary.map((action) => (
        <DataTableRowAction key={action.label} {...action} />
      ))}
      {hasMenu ? (
        <RowMenu label={label} compact={compact} primary={[]}>
          {children}
        </RowMenu>
      ) : null}
    </span>
  );
}

export type ActionsColumnInput<TData> = {
  label: string;
  /** One `DataTableRowActions` per row. */
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
    size: 80,
    header: () => <span className="sr-only">{label}</span>,
    cell: ({ row }) => cell(row.original),
  };
}
