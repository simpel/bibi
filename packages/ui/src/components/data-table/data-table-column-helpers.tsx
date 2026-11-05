import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import { ColorSwatch } from "../color-swatch/color-swatch";

export type StatusBadgeProps = {
  label: ReactNode;
  color?: string | null;
  className?: string;
};

/**
 * Canonical status & state badge used across all tables, cards, and hover popovers:
 * `<Badge variant="secondary" className="gap-1.5"><ColorSwatch color={...} />{label}</Badge>`.
 */
export function StatusBadge({ label, color, className }: StatusBadgeProps) {
  return (
    <Badge data-slot="status-badge" variant="secondary" className={cn("gap-1.5", className)}>
      <ColorSwatch color={color ?? "var(--muted-foreground)"} />
      {label}
    </Badge>
  );
}

export type StatusColumnValue = {
  label: string;
  color?: string | null;
};

export type StatusColumnInput<TData> = {
  id?: string;
  header: string;
  getStatus: (row: TData) => StatusColumnValue | null | undefined;
  enableSorting?: boolean;
};

/**
 * Canonical Status / State column (Zone 4). Renders `StatusBadge` and sorts by label.
 */
export function statusColumn<TData>({
  id = "status",
  header,
  getStatus,
  enableSorting,
}: StatusColumnInput<TData>): ColumnDef<TData> {
  return {
    id,
    header,
    ...(enableSorting !== undefined ? { enableSorting } : {}),
    accessorFn: (row) => getStatus(row)?.label ?? "",
    cell: ({ row }) => {
      const status = getStatus(row.original);
      return status ? <StatusBadge label={status.label} color={status.color} /> : "–";
    },
  };
}

export type DateColumnInput<TData> = {
  id: string;
  header: string;
  getSortValue?: (row: TData) => number | string;
  cell: (row: TData) => ReactNode;
  enableSorting?: boolean;
};

/**
 * Canonical Date / Time column (Zone 5). Enforces `whitespace-nowrap tabular-nums`.
 */
export function dateColumn<TData>({
  id,
  header,
  getSortValue,
  cell,
  enableSorting,
}: DateColumnInput<TData>): ColumnDef<TData> {
  return {
    id,
    header,
    ...(enableSorting !== undefined ? { enableSorting } : {}),
    ...(getSortValue ? { accessorFn: getSortValue } : {}),
    cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{cell(row.original)}</span>,
  };
}

export type NumberColumnInput<TData> = {
  id: string;
  header: string;
  getValue: (row: TData) => number | string;
  cell?: (row: TData) => ReactNode;
  align?: "left" | "right";
  enableSorting?: boolean;
};

/**
 * Canonical Number / Amount column (Zone 6). Enforces `tabular-nums` and optional right alignment.
 */
export function numberColumn<TData>({
  id,
  header,
  getValue,
  cell,
  align = "left",
  enableSorting,
}: NumberColumnInput<TData>): ColumnDef<TData> {
  return {
    id,
    header: align === "right" ? () => <div className="text-right">{header}</div> : header,
    ...(enableSorting !== undefined ? { enableSorting } : {}),
    accessorFn: getValue,
    cell: ({ row }) => (
      <div className={cn("tabular-nums", align === "right" && "text-right")}>
        {cell ? cell(row.original) : getValue(row.original)}
      </div>
    ),
  };
}

export type TableColumnZones<TData> = {
  /** Zone 1: Checkbox / row selection */
  select?: ColumnDef<TData>[];
  /** Zone 2: Primary identifier (Title / Name / Subject / Number) */
  primary: ColumnDef<TData>[];
  /** Zone 3: Descriptive & relational columns (Customer, Type, Assignee, Plan, etc.) */
  relations?: ColumnDef<TData>[];
  /** Zone 4: Status / State badge column(s) */
  status?: ColumnDef<TData>[];
  /** Zone 5: Dates / Times (When, Trial ends, Created, Updated, etc.) */
  dates?: ColumnDef<TData>[];
  /** Zone 6: Numbers / Counts / Amounts (Quantity, Seats, Amount, Total, etc.) */
  numbers?: ColumnDef<TData>[];
  /** Zone 7: Sticky right row actions (`actionsColumn`) */
  actions?: ColumnDef<TData>[];
};

/**
 * Assembles a table's `ColumnDef<TData>[]` in the mandatory 7-zone canonical order
 * (ADR 0040): `[select] → [primary] → [relations] → [status] → [dates] → [numbers] → [actions]`.
 */
export function createTableColumns<TData>({
  select = [],
  primary,
  relations = [],
  status = [],
  dates = [],
  numbers = [],
  actions = [],
}: TableColumnZones<TData>): ColumnDef<TData>[] {
  return [...select, ...primary, ...relations, ...status, ...dates, ...numbers, ...actions];
}
