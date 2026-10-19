import type { VocabularyValueDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { ValueRowActions } from "./value-row-actions";

type Column = ColumnDef<VocabularyValueDto>;

export type UseValueColumnsInput = { vocabularyId: string; access: RowAccess };

/** Name, plus the row actions when the caller can write. */
export function useValueColumns({ vocabularyId, access }: UseValueColumnsInput): Column[] {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [{ id: "name", header: t("name"), accessorFn: (value) => value.name }];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<VocabularyValueDto>({
        label: common("actions"),
        cell: (value) => (
          <ValueRowActions vocabularyId={vocabularyId} value={value} access={access} />
        ),
      }),
    ];
  }, [t, common, vocabularyId, access]);
}
