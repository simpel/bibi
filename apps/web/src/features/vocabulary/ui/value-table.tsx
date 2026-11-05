"use client";

import type { VocabularyDto, VocabularyValueDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useValueColumns } from "./use-value-columns";

export type ValueTableProps = { vocabulary: VocabularyDto; access: RowAccess };

/** Active values of a list, in order, with unified `QuerySearch` and `DataTablePagination`. */
export function ValueTable({ vocabulary, access }: ValueTableProps) {
  const t = useTranslations("vocabulary.value");
  const columns = useValueColumns({ vocabularyId: vocabulary.id, access });
  const qualifiers: TableQualifier<VocabularyValueDto>[] = useMemo(
    () => [
      {
        key: "name",
        label: t("name"),
        hint: t("name"),
        pick: (v) => v.name,
        options: vocabulary.values.map((v) => v.name),
      },
    ],
    [t, vocabulary.values],
  );
  const view = useClientTableView({
    rows: vocabulary.values,
    qualifiers,
    getSearchText: (v) => v.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="vocabulary.values"
        columns={columns}
        data={view.rows}
        getRowId={(value) => value.id}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
