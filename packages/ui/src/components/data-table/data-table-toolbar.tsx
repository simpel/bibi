import type { ReactNode } from "react";

export type DataTableToolbarProps = { selectedLabel: string; children: ReactNode };

/** Bulk action bar, shown above the table while rows are selected. */
export function DataTableToolbar({ selectedLabel, children }: DataTableToolbarProps) {
  return (
    <div
      data-slot="data-table-toolbar"
      className="mb-2 flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 px-3 py-2"
    >
      <span className="text-sm font-medium">{selectedLabel}</span>
      {children}
    </div>
  );
}
