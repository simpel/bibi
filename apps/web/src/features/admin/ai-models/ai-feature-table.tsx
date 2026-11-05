"use client";

import { cn, type SortingState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useDataTablePaginationLabels } from "@/lib/use-data-table-pagination-labels";
import { useQueryNavigation } from "@/lib/use-query-navigation";
import { AI_MODEL_PAGE_SIZES, type AiModelViewParams } from "./ai-model-params";
import { filterAiFeatures, sortAiFeatures } from "./filter-ai-features";
import type { AiFeatureRow } from "./model-options";
import { useAiFeatureColumns } from "./use-ai-feature-columns";

export type AiFeatureTableProps = {
  rows: AiFeatureRow[];
  view: AiModelViewParams;
};

const sortPatch = ({ sorting }: { sorting: SortingState }) => {
  const [next] = sorting;
  return next ? { sort: next.id, dir: next.desc ? "desc" : "asc" } : { sort: null, dir: null };
};

type RowsInput = { rows: AiFeatureRow[]; view: AiModelViewParams };

function useProcessedRows({ rows, view }: RowsInput) {
  const t = useTranslations("admin.aiModels");
  const filtered = useMemo(() => filterAiFeatures({ rows, q: view.q, t }), [rows, view.q, t]);
  return useMemo(
    () => sortAiFeatures({ rows: filtered, sort: view.sort, direction: view.direction, t }),
    [filtered, view.sort, view.direction, t],
  );
}

/** All AI features in one table with pagination, filtering and sorting. */
export function AiFeatureTable({ rows, view }: AiFeatureTableProps) {
  const t = useTranslations("admin.aiModels");
  const columns = useAiFeatureColumns();
  const { navigate, pending } = useQueryNavigation();
  const labels = useDataTablePaginationLabels({
    total: (count) => t("pagination.total", { count }),
  });
  const sorted = useProcessedRows({ rows, view });
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / view.pageSize));
  const paginated = sorted.slice((view.page - 1) * view.pageSize, view.page * view.pageSize);

  return (
    <PersistedDataTable
      tableId="admin.ai-models"
      className={cn(pending && "opacity-60 transition-opacity")}
      columns={columns}
      data={paginated}
      getRowId={(row) => row.setting.id}
      emptyText={t("empty")}
      pagination={{
        pageIndex: view.page - 1,
        pageSize: view.pageSize,
        pageCount,
        totalCount: total,
        pageSizeOptions: AI_MODEL_PAGE_SIZES,
        labels,
        onPaginationChange: ({ pageIndex, pageSize: size }) =>
          navigate({ patch: { page: String(pageIndex + 1), pageSize: String(size) } }),
      }}
      manualSorting
      sorting={[{ id: view.sort, desc: view.direction === "desc" }]}
      onSortingChange={(sorting) => navigate({ patch: sortPatch({ sorting }) })}
    />
  );
}
