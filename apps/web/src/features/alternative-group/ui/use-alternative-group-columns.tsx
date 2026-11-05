import type { AlternativeGroupDto } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef, createTableColumns, statusColumn } from "@bibi/ui";
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
    return createTableColumns<AlternativeGroupDto>({
      primary: [{ id: "name", header: t("columns.name"), accessorFn: (group) => group.name }],
      relations: [
        {
          id: "options",
          header: t("columns.options"),
          accessorFn: (group) => group.optionLineIds.map((id) => nameOf({ id })).join(", "),
        },
      ],
      status: [
        statusColumn<AlternativeGroupDto>({
          header: t("columns.status"),
          getStatus: (group) => ({
            label: group.chosenLineId
              ? t("chosen", { name: nameOf({ id: group.chosenLineId }) })
              : t("open"),
            color: group.chosenLineId ? "var(--success)" : "var(--muted-foreground)",
          }),
        }),
      ],
      actions: canWrite
        ? [
            actionsColumn<AlternativeGroupDto>({
              label: common("actions"),
              cell: (group) => <AlternativeGroupRowActions group={group} lines={lines} />,
            }),
          ]
        : [],
    });
  }, [t, common, lines, canWrite]);
}
