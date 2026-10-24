import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { DemandRowActions } from "./demand-row-actions";
import type { DemandRow } from "./demand-types";

type Column = ColumnDef<DemandRow>;

export type UseDemandColumnsInput = { canEdit: boolean };

/** Target · mandatory or optional · quantity · windows, plus the row actions when writable. */
export function useDemandColumns({ canEdit }: UseDemandColumnsInput): Column[] {
  const t = useTranslations("itemDemand");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      { id: "target", header: t("columns.target"), accessorFn: (row) => row.targetName },
      {
        id: "required",
        header: t("columns.required"),
        accessorFn: (row) => (row.demand.required ? t("mandatory") : t("optional")),
      },
      { id: "quantity", header: t("columns.quantity"), accessorFn: (row) => row.demand.quantity },
      {
        id: "windows",
        header: t("columns.windows"),
        accessorFn: (row) => row.demand.windows.map((window) => t(`windows.${window}`)).join(", "),
      },
    ];
    if (!canEdit) return columns;
    return [
      ...columns,
      actionsColumn<DemandRow>({
        label: common("actions"),
        cell: (row) => <DemandRowActions row={row} />,
      }),
    ];
  }, [t, common, canEdit]);
}
