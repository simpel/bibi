import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";
import { DATA_TABLE_ACTIONS_COLUMN_ID } from "./data-table-order";

export type DataTableRowActionsProps = {
  /** The trigger's text and accessible name, e.g. "Actions". */
  label: string;
  /** The dots alone, `label` only for screen readers: for tight spots outside tables (boards). */
  compact?: boolean;
  /** `DropdownMenuItem`s. Every item must have a text label, never an icon alone. */
  children: ReactNode;
};

/**
 * Several row actions as a menu of text items. The trigger shows its label on wide tables and the
 * dots alone on narrow ones. One or two clear actions are `DataTableRowAction` buttons instead.
 */
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
          <Button
            variant="outline"
            size="sm"
            aria-label={label}
            className="whitespace-nowrap px-2 @2xl:px-3"
          >
            <MoreHorizontalIcon aria-hidden />
            <span className="hidden @2xl:inline">{label}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
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

export type DataTableRowActionProps = {
  /** The visible text on wide tables, and always the accessible name and tooltip. */
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  /** The icon alone at every width, for actions whose icon is unmistakable (download, copy). */
  iconOnly?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * One direct row action in the actions column. A narrow table shows the icon, a wide one icon and
 * label, unless `iconOnly`. The label is always the accessible name and the tooltip.
 */
export function DataTableRowAction({
  label,
  icon: Icon,
  onClick,
  iconOnly = false,
  destructive = false,
  disabled,
}: DataTableRowActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn("px-2", !iconOnly && "@2xl:px-3", destructive && "text-destructive")}
        >
          <Icon aria-hidden />
          {iconOnly ? null : <span className="hidden @2xl:inline">{label}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Lays out the actions of one row side by side, right-aligned. */
export function DataTableRowActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}
