import { actionsColumn, Badge, type ColumnDef, createTableColumns, numberColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { AccountRow } from "../lib/account-rows";
import type { AccountLabels } from "./use-account-labels";

export type UseAccountColumnsInput = {
  labels: AccountLabels;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: AccountRow) => ReactNode;
  /** The row whose account is the default revenue account shows a badge. */
  isDefault?: (row: AccountRow) => boolean;
  /** Makes the name open the edit dialog; omit for plain text (a read-only caller). */
  onEdit?: (row: AccountRow) => void;
};

/** Name and account of each row, with the edit action last. */
export function useAccountColumns({
  labels,
  renderActions,
  isDefault,
  onEdit,
}: UseAccountColumnsInput): ColumnDef<AccountRow>[] {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  return createTableColumns<AccountRow>({
    primary: [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: labels.name,
        cell: ({ row }) => {
          const name = labels.name(row.original);
          return (
            <span className="flex items-center gap-2">
              {onEdit ? (
                <button
                  type="button"
                  className="text-left font-medium underline-offset-4 hover:underline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(row.original);
                  }}
                >
                  {name}
                </button>
              ) : (
                <span className="font-medium">{name}</span>
              )}
              {isDefault?.(row.original) ? (
                <Badge variant="secondary">{t("isDefault")}</Badge>
              ) : null}
            </span>
          );
        },
      },
    ],
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
