import { actionsColumn, type ColumnDef, createTableColumns, numberColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { AccountRow } from "../lib/account-rows";
import type { AccountLabels } from "./use-account-labels";

export type UseAccountColumnsInput = {
  labels: AccountLabels;
  /** Adds the group column (fixed accounts); item type rows have no group. */
  grouped: boolean;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: AccountRow) => ReactNode;
};

/** Name, optional group and account of each row, with the edit action last. */
export function useAccountColumns({
  labels,
  grouped,
  renderActions,
}: UseAccountColumnsInput): ColumnDef<AccountRow>[] {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  return createTableColumns<AccountRow>({
    primary: [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: labels.name,
        cell: ({ row }) => <span className="font-medium">{labels.name(row.original)}</span>,
      },
    ],
    relations: grouped
      ? [
          {
            id: "group",
            header: t("columns.group"),
            accessorFn: (row) => labels.group(row) ?? "",
          },
        ]
      : [],
    numbers: [
      numberColumn<AccountRow>({
        id: "account",
        header: t("columns.account"),
        getValue: ({ value }) => value,
        align: "left",
      }),
    ],
    actions: renderActions
      ? [actionsColumn<AccountRow>({ label: common("actions"), cell: renderActions })]
      : [],
  });
}
