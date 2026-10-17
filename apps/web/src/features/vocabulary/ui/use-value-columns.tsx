import type { VocabularyValueDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ValueRowActions } from "./value-row-actions";

type Column = ColumnDef<VocabularyValueDto>;

export type UseValueColumnsInput = { vocabularyId: string; canWrite: boolean };

/** Name, plus the row actions when the caller can write. */
export function useValueColumns({ vocabularyId, canWrite }: UseValueColumnsInput): Column[] {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [{ id: "name", header: t("name"), accessorFn: (value) => value.name }];
    if (!canWrite) return data;
    return [
      ...data,
      actionsColumn<VocabularyValueDto>({
        label: common("actions"),
        cell: (value) => <ValueRowActions vocabularyId={vocabularyId} value={value} />,
      }),
    ];
  }, [t, common, vocabularyId, canWrite]);
}
