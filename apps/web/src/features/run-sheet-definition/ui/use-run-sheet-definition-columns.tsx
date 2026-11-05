import type { RunSheetDefinitionDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { RunSheetDefinitionRowActions } from "./run-sheet-definition-row-actions";
import { namesOf, type RunSheetOptions } from "./run-sheet-options";

type Column = ColumnDef<RunSheetDefinitionDto>;

export type UseRunSheetDefinitionColumnsInput = { options: RunSheetOptions; access: RowAccess };

type NamesInput = { ids: readonly string[]; options: RunSheetOptions[keyof RunSheetOptions] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

/** Name · types · lists · role, plus the row actions when the caller can write. */
export function useRunSheetDefinitionColumns({
  options,
  access,
}: UseRunSheetDefinitionColumnsInput): Column[] {
  const t = useTranslations("runSheetDefinition");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (runSheet) => runSheet.name },
      {
        id: "types",
        header: t("columns.types"),
        accessorFn: (runSheet) => names({ ids: runSheet.entityTypeIds, options: options.types }),
      },
      {
        id: "lists",
        header: t("columns.lists"),
        accessorFn: (runSheet) => names({ ids: runSheet.vocabularyIds, options: options.lists }),
      },
      {
        id: "responsibility",
        header: t("columns.responsibility"),
        accessorFn: (runSheet) =>
          names({ ids: [runSheet.responsibilityId], options: options.responsibilities }),
      },
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<RunSheetDefinitionDto>({
        label: common("actions"),
        cell: (runSheet) => <RunSheetDefinitionRowActions runSheet={runSheet} access={access} />,
      }),
    ];
  }, [t, common, options, access]);
}
