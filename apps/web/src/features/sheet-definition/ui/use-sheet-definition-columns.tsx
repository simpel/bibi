import type { SheetDefinitionDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { SheetDefinitionRowActions } from "./sheet-definition-row-actions";
import { namesOf, type SheetOptions } from "./sheet-options";

type Column = ColumnDef<SheetDefinitionDto>;

export type UseSheetDefinitionColumnsInput = { options: SheetOptions; access: RowAccess };

type NamesInput = { ids: readonly string[]; options: SheetOptions[keyof SheetOptions] };

const names = ({ ids, options }: NamesInput) => {
  const found = namesOf({ ids, options });
  return found.length > 0 ? found.join(", ") : "–";
};

/** Name · types · lists · role, plus the row actions when the caller can write. */
export function useSheetDefinitionColumns({
  options,
  access,
}: UseSheetDefinitionColumnsInput): Column[] {
  const t = useTranslations("sheetDefinition");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (sheet) => sheet.name },
      {
        id: "types",
        header: t("columns.types"),
        accessorFn: (sheet) => names({ ids: sheet.entityTypeIds, options: options.types }),
      },
      {
        id: "lists",
        header: t("columns.lists"),
        accessorFn: (sheet) => names({ ids: sheet.vocabularyIds, options: options.lists }),
      },
      {
        id: "role",
        header: t("columns.role"),
        accessorFn: (sheet) => names({ ids: [sheet.roleId], options: options.roles }),
      },
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<SheetDefinitionDto>({
        label: common("actions"),
        cell: (sheet) => <SheetDefinitionRowActions sheet={sheet} access={access} />,
      }),
    ];
  }, [t, common, options, access]);
}
