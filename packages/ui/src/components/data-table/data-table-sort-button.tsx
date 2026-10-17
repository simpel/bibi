import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { DataTableTextLabels } from "./data-table-types";

export type DataTableSortButtonProps<TData> = {
  column: Column<TData, unknown>;
  title: string;
  labels: DataTableTextLabels;
  children: ReactNode;
};

/** Cycles ascending, descending, unsorted. */
export function DataTableSortButton<TData>({
  column,
  title,
  labels,
  children,
}: DataTableSortButtonProps<TData>) {
  const sorted = column.getIsSorted();
  const next =
    sorted === false
      ? { label: labels.sortAscending, run: () => column.toggleSorting(false) }
      : sorted === "asc"
        ? { label: labels.sortDescending, run: () => column.toggleSorting(true) }
        : { label: labels.clearSort, run: () => column.clearSorting() };
  const Icon =
    sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ChevronsUpDownIcon;
  return (
    <button
      type="button"
      aria-label={`${title}, ${next.label}`}
      onClick={next.run}
      className="-mx-1 flex items-center gap-1 rounded-sm px-1 py-0.5 font-medium outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <Icon className={cn("size-3.5 shrink-0", sorted === false && "opacity-40")} aria-hidden />
    </button>
  );
}
