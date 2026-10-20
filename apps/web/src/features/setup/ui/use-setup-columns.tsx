import type { SetupDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { SetupRowActions } from "./setup-row-actions";

type Column = ColumnDef<SetupDto>;

/** Name · changeover minutes, plus the row actions when the caller can write. */
export function useSetupColumns({ access }: { access: RowAccess }): Column[] {
  const t = useTranslations("setup");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const data: Column[] = [
      { id: "name", header: t("columns.name"), accessorFn: (setup) => setup.name },
      {
        id: "changeover",
        header: t("columns.changeover"),
        accessorFn: (setup) => setup.changeoverMinutes,
        cell: ({ row }) => t("changeoverValue", { minutes: row.original.changeoverMinutes }),
      },
    ];
    if (!access.canEdit && !access.canRemove) return data;
    return [
      ...data,
      actionsColumn<SetupDto>({
        label: common("actions"),
        cell: (setup) => <SetupRowActions setup={setup} access={access} />,
      }),
    ];
  }, [t, common, access]);
}
