"use client";

import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AccountRow } from "../lib/account-rows";

export type AccountRowActionsProps = {
  row: AccountRow;
  /** Opens the edit dialog; it lives in the table so a context menu and a row click open it too. */
  onEdit: (row: AccountRow) => void;
};

/** The edit action of one row. */
export function AccountRowActions({ row, onEdit }: AccountRowActionsProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={[{ label: t("edit"), icon: PencilIcon, onClick: () => onEdit(row) }]}
    />
  );
}

/** Right-click menu of one row: the same edit action. */
export function AccountRowMenu({ row, onEdit }: AccountRowActionsProps) {
  const t = useTranslations("finance.accounting");
  return (
    <ContextMenuItem onSelect={() => onEdit(row)}>
      <PencilIcon />
      {t("edit")}
    </ContextMenuItem>
  );
}
