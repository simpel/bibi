import type { SetupDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, createTableColumns, numberColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import { SetupRowActions } from "./setup-row-actions";

type Column = ColumnDef<SetupDto>;

/** Name · changeover minutes, plus the row actions when the caller can write. */
export function useSetupColumns({ access }: { access: RowAccess }): Column[] {
  const t = useTranslations("setup");
  const common = useTranslations("common");
  return useMemo<Column[]>(
    () =>
      createTableColumns<SetupDto>({
        primary: [{ id: "name", header: t("columns.name"), accessorFn: (setup) => setup.name }],
        numbers: [
          numberColumn<SetupDto>({
            id: "changeover",
            header: t("columns.changeover"),
            getValue: (setup) => setup.changeoverMinutes,
            cell: (setup) => t("changeoverValue", { minutes: setup.changeoverMinutes }),
          }),
        ],
        actions:
          access.canEdit || access.canRemove
            ? [
                actionsColumn<SetupDto>({
                  label: common("actions"),
                  cell: (setup) => <SetupRowActions setup={setup} access={access} />,
                }),
              ]
            : [],
      }),
    [t, common, access],
  );
}
