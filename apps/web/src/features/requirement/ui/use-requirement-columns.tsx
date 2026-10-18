import type { RequirementDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import type { RequirementFormData } from "./requirement-form-data";
import { RequirementRowActions } from "./requirement-row-actions";

type Column = ColumnDef<RequirementDto>;

export type UseRequirementColumnsInput = { data: RequirementFormData; canWrite: boolean };

/** Value · where · type · quantity, plus the row actions when the caller can write. */
export function useRequirementColumns({ data, canWrite }: UseRequirementColumnsInput): Column[] {
  const t = useTranslations("requirement");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns: Column[] = [
      {
        id: "value",
        header: t("columns.value"),
        accessorFn: (row) => nameOf({ options: data.values, id: row.vocabularyValueId }),
      },
      {
        id: "where",
        header: t("columns.where"),
        accessorFn: (row) =>
          row.programItemId
            ? nameOf({ options: data.programItems, id: row.programItemId })
            : t("wholeTicket"),
      },
      {
        id: "type",
        header: t("columns.type"),
        accessorFn: (row) => nameOf({ options: data.types, id: row.entityTypeId }),
      },
      { id: "quantity", header: t("columns.quantity"), accessorFn: (row) => row.quantity },
    ];
    if (!canWrite) return columns;
    return [
      ...columns,
      actionsColumn<RequirementDto>({
        label: common("actions"),
        cell: (row) => <RequirementRowActions requirement={row} data={data} />,
      }),
    ];
  }, [t, common, data, canWrite]);
}
