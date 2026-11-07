import type { VocabularyValueDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, createTableColumns } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { type ValueAction, ValueRowActions } from "./value-row-actions";

export type UseValueColumnsInput = {
  access: RowAccess;
  onAction: (action: ValueAction) => void;
};

/** Name, plus the row actions when the caller can write. */
export function useValueColumns({
  access,
  onAction,
}: UseValueColumnsInput): ColumnDef<VocabularyValueDto>[] {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  return useMemo(
    () =>
      createTableColumns<VocabularyValueDto>({
        primary: [
          {
            id: "name",
            header: t("name"),
            accessorFn: (value) => value.name,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
          },
        ],
        actions:
          access.canEdit || access.canRemove
            ? [
                actionsColumn<VocabularyValueDto>({
                  label: common("actions"),
                  cell: (value) => (
                    <ValueRowActions value={value} access={access} onAction={onAction} />
                  ),
                }),
              ]
            : [],
      }),
    [t, common, access, onAction],
  );
}
