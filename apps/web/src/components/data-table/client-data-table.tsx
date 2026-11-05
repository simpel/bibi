"use client";

import type { ReactNode } from "react";
import { PersistedDataTable, type PersistedDataTableProps } from "./persisted-data-table";
import { type QuickFilterPill, TableFilterBar } from "./table-filter-bar";
import type { TableQualifier } from "./table-filter-query";
import { useClientTableView } from "./use-client-table-view";

export type ClientDataTableProps<TRow, TValue = unknown> = Omit<
  PersistedDataTableProps<TRow, TValue>,
  "data" | "pagination"
> & {
  data: readonly TRow[];
  qualifiers?: readonly TableQualifier<TRow>[];
  pills?: readonly QuickFilterPill[];
  getSearchText: (row: TRow) => string;
  totalLabel?: (count: number) => string;
  toolbarChildren?: ReactNode;
};

/**
 * Standard client-paged table with URL-backed search (`?q=`), quick-filter pills,
 * qualifier suggestions, column order persistence (`PersistedDataTable`), and pagination.
 */
export function ClientDataTable<TRow, TValue = unknown>({
  data,
  qualifiers = [],
  pills,
  getSearchText,
  totalLabel = (count) => `${count}`,
  toolbarChildren,
  ...tableProps
}: ClientDataTableProps<TRow, TValue>) {
  const view = useClientTableView({
    rows: data,
    qualifiers,
    getSearchText,
    totalLabel,
  });

  return (
    <div className="grid gap-4">
      <TableFilterBar
        q={view.q}
        query={view.query}
        pills={pills}
        onSelectPill={(next) => view.navigate({ patch: { q: next ?? null, page: null } })}
      >
        {toolbarChildren}
      </TableFilterBar>
      <PersistedDataTable {...tableProps} data={view.rows} pagination={view.pagination} />
    </div>
  );
}
