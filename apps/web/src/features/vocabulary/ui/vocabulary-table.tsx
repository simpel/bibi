"use client";

import type { VocabularyDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { useVocabularyColumns } from "./use-vocabulary-columns";

export type VocabularyTableProps = { vocabularies: VocabularyDto[]; access: RowAccess };

/** Lists of the organization with their value counts; names link to the detail page. */
export function VocabularyTable({ vocabularies, access }: VocabularyTableProps) {
  const t = useTranslations("vocabulary");
  const columns = useVocabularyColumns({ access });
  return (
    <PersistedDataTable
      tableId="vocabulary.list"
      columns={columns}
      data={vocabularies}
      getRowId={(vocabulary) => vocabulary.id}
      emptyText={t("empty")}
    />
  );
}
