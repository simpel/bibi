"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import {
  type BuiltTableQuery,
  buildTableQuery,
  filterTableRows,
  type TableQualifier,
} from "./table-filter-query";
import { type TableQueryKeys, tableQueryKeys } from "./table-query-keys";

export const CLIENT_TABLE_PAGE_SIZES = [25, 50, 100];

export type UseClientTableViewInput<TRow> = {
  rows: readonly TRow[];
  qualifiers: readonly TableQualifier<TRow>[];
  getSearchText: (row: TRow) => string;
  totalLabel: (count: number) => string;
  /** A second table on the page: its own URL keys (`<scope>.q`, `<scope>.page`). */
  scope?: string;
};

function parsePositiveInt({ value, fallback }: { value: string | null; fallback: number }): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

type ScopedPatchInput = { patch: Record<string, string | null>; keys: TableQueryKeys };

function scopedPatch({ patch, keys }: ScopedPatchInput): Record<string, string | null> {
  const names: Record<string, string> = { q: keys.q, page: keys.page, pageSize: keys.pageSize };
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [names[key] ?? key, value]),
  );
}

/**
 * URL-backed search (`?q=`) with qualifier suggestions and pagination (`?page=`, `?pageSize=`)
 * for client-side tables, matching the server-paged tables' UX.
 */
export function useClientTableView<TRow>({
  rows,
  qualifiers,
  getSearchText,
  totalLabel,
  scope,
}: UseClientTableViewInput<TRow>) {
  const keys = tableQueryKeys({ scope });
  const searchParams = useSearchParams();
  const queryNavigation = useQueryNavigation();
  const pending = queryNavigation.pending;
  /** Patches with the plain names (`q`, `page`, `pageSize`); they are mapped to this table's keys. */
  const navigate = ({ patch }: { patch: Record<string, string | null> }) =>
    queryNavigation.navigate({ patch: scopedPatch({ patch, keys }), pageKey: keys.page });
  const q = searchParams.get(keys.q) ?? undefined;
  const rawSize = parsePositiveInt({ value: searchParams.get(keys.pageSize), fallback: 25 });
  const pageSize = CLIENT_TABLE_PAGE_SIZES.includes(rawSize) ? rawSize : 25;
  const query: BuiltTableQuery = useMemo(() => buildTableQuery({ qualifiers }), [qualifiers]);
  const filtered = useMemo(
    () => filterTableRows({ rows, q, qualifiers, getSearchText }),
    [rows, q, qualifiers, getSearchText],
  );
  const totalCount = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(
    parsePositiveInt({ value: searchParams.get(keys.page), fallback: 1 }),
    pageCount,
  );
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );
  const labels = useDataTablePaginationLabels({ total: totalLabel });
  const pagination = {
    pageIndex: page - 1,
    pageSize,
    pageCount,
    totalCount,
    pageSizeOptions: CLIENT_TABLE_PAGE_SIZES,
    labels,
    onPaginationChange: ({
      pageIndex,
      pageSize: nextSize,
    }: {
      pageIndex: number;
      pageSize: number;
    }) => navigate({ patch: { page: String(pageIndex + 1), pageSize: String(nextSize) } }),
  };
  return { rows: paged, pagination, q, pending, query, navigate, keys };
}
