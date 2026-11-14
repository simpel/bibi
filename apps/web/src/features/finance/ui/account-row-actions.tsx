"use client";

import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AccountRow } from "../lib/account-rows";

/** Makes a row's account the default revenue account; a row that already is one offers nothing. */
export type DefaultAction = { isDefault: boolean; onSetDefault: (row: AccountRow) => void };

export type AccountRowActionsProps = {
  row: AccountRow;
  /** Opens the edit dialog; it lives in the table so a context menu and a row click open it too. */
  onEdit: (row: AccountRow) => void;
  /** Present on the revenue-per-type table: a menu with Edit and Set as default. */
  defaultAction?: DefaultAction | undefined;
};

/** The actions of one row: the edit button, or a menu of Edit and Set as default. */
export function AccountRowActions({ row, onEdit, defaultAction }: AccountRowActionsProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  if (!defaultAction) {
    return (
      <DataTableRowActions
        label={common("actions")}
        primary={[{ label: t("edit"), icon: PencilIcon, onClick: () => onEdit(row) }]}
      />
    );
  }
  return (
    <DataTableRowActions label={common("actions")}>
      <DropdownMenuItem onSelect={() => onEdit(row)}>{t("edit")}</DropdownMenuItem>
      {defaultAction.isDefault ? null : (
        <DropdownMenuItem onSelect={() => defaultAction.onSetDefault(row)}>
          {t("setDefault")}
        </DropdownMenuItem>
      )}
    </DataTableRowActions>
  );
}

/** Right-click menu of one row: the same actions. */
export function AccountRowMenu({ row, onEdit, defaultAction }: AccountRowActionsProps) {
  const t = useTranslations("finance.accounting");
  return (
    <>
      <ContextMenuItem onSelect={() => onEdit(row)}>
        <PencilIcon />
        {t("edit")}
      </ContextMenuItem>
      {defaultAction && !defaultAction.isDefault ? (
        <ContextMenuItem onSelect={() => defaultAction.onSetDefault(row)}>
          {t("setDefault")}
        </ContextMenuItem>
      ) : null}
    </>
  );
}
