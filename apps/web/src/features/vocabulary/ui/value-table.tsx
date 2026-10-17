"use client";

import type { VocabularyDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useValueColumns } from "./use-value-columns";

export type ValueTableProps = { vocabulary: VocabularyDto; canWrite: boolean };

/** Active values of a list, in order. */
export function ValueTable({ vocabulary, canWrite }: ValueTableProps) {
  const t = useTranslations("vocabulary.value");
  const columns = useValueColumns({ vocabularyId: vocabulary.id, canWrite });
  return (
    <PersistedDataTable
      tableId="vocabulary.values"
      columns={columns}
      data={vocabulary.values}
      getRowId={(value) => value.id}
      emptyText={t("empty")}
    />
  );
}
