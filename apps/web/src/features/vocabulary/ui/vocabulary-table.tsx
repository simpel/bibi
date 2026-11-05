"use client";

import type { VocabularyDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { vocabularyRoute } from "@/lib/configuration-routes";
import { useRouter } from "@/lib/navigation";
import { useVocabularyColumns } from "./use-vocabulary-columns";
import { VocabularyRowMenu } from "./vocabulary-row-actions";

export type VocabularyTableProps = { vocabularies: VocabularyDto[]; access: RowAccess };

/** Lists of the organization with their value counts; names link to the detail page. */
export function VocabularyTable({ vocabularies, access }: VocabularyTableProps) {
  const t = useTranslations("vocabulary");
  const router = useRouter();
  const columns = useVocabularyColumns({ access });
  const qualifiers: TableQualifier<VocabularyDto>[] = useMemo(
    () => [
      {
        key: "name",
        label: t("columns.name"),
        hint: t("columns.name"),
        pick: (v) => v.name,
        options: vocabularies.map((v) => v.name),
      },
    ],
    [t, vocabularies],
  );
  const view = useClientTableView({
    rows: vocabularies,
    qualifiers,
    getSearchText: (v) => `${v.name} ${v.values.map((val) => val.name).join(" ")}`,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="vocabulary.list"
        columns={columns}
        data={view.rows}
        getRowId={(vocabulary) => vocabulary.id}
        onRowClick={(vocabulary) => router.push(vocabularyRoute({ id: vocabulary.id }))}
        rowMenu={(vocabulary) => <VocabularyRowMenu vocabulary={vocabulary} access={access} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
