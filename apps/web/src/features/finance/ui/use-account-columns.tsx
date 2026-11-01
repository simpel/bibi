import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { type AccountRow, rowGroup } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";

export type UseAccountColumnsInput = {
  types: ItemTypeOption[];
  /** Adds the group column (fixed accounts); item type rows have no group. */
  grouped: boolean;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: AccountRow) => ReactNode;
};

/** Name, optional group and account of each row, with the edit action last. */
export function useAccountColumns({
  types,
  grouped,
  renderActions,
}: UseAccountColumnsInput): ColumnDef<AccountRow>[] {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const label = ({ target }: AccountRow) => {
    if (target.kind === "account") return t(`fields.${target.key}`);
    const entityTypeId = target.entityTypeId;
    return types.find(({ id }) => id === entityTypeId)?.name ?? "–";
  };
  const group: ColumnDef<AccountRow>[] = grouped
    ? [
        {
          id: "group",
          header: t("columns.group"),
          accessorFn: ({ target }) =>
            target.kind === "account" ? t(`groups.${rowGroup({ key: target.key })}`) : "",
        },
      ]
    : [];
  const actions = renderActions
    ? [actionsColumn<AccountRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    {
      id: "name",
      header: t("columns.name"),
      accessorFn: label,
      cell: ({ row }) => <span className="font-medium">{label(row.original)}</span>,
    },
    ...group,
    { id: "account", header: t("columns.account"), accessorFn: ({ value }) => value },
    ...actions,
  ];
}
