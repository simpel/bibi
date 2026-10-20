import type { AlternativeGroupDto } from "@okazi/core/schemas";
import { actionsColumn, Badge, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AlternativeGroupRowActions } from "./alternative-group-row-actions";
import type { OptionLine } from "./option-line";

type Column = ColumnDef<AlternativeGroupDto>;

export type UseAlternativeGroupColumnsInput = { lines: OptionLine[]; canWrite: boolean };

/** Name · options · status, plus the row actions when writable. */
export function useAlternativeGroupColumns({
  lines,
  canWrite,
}: UseAlternativeGroupColumnsInput): Column[] {
  const t = useTranslations("alternativeGroup");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const nameOf = ({ id }: { id: string }) => lines.find((line) => line.id === id)?.name ?? id;
    const columns: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (group) => group.name },
      {
        id: "options",
        header: t("columns.options"),
        accessorFn: (group) => group.optionLineIds.map((id) => nameOf({ id })).join(", "),
      },
      {
        id: "status",
        header: t("columns.status"),
        accessorFn: (group) => (group.chosenLineId ? nameOf({ id: group.chosenLineId }) : ""),
        cell: ({ row: { original } }) =>
          original.chosenLineId ? (
            <Badge variant="success">
              {t("chosen", { name: nameOf({ id: original.chosenLineId }) })}
            </Badge>
          ) : (
            <Badge variant="outline">{t("open")}</Badge>
          ),
      },
    ];
    if (!canWrite) return columns;
    return [
      ...columns,
      actionsColumn<AlternativeGroupDto>({
        label: common("actions"),
        cell: (group) => <AlternativeGroupRowActions group={group} lines={lines} />,
      }),
    ];
  }, [t, common, lines, canWrite]);
}
