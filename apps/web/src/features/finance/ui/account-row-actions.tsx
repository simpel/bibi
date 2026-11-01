"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { AccountRow } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { AccountDialog } from "./account-dialog";

export type AccountRowActionsProps = {
  row: AccountRow;
  settings: AccountingSettingsDto;
  types: ItemTypeOption[];
};

/** The edit action of one row; it opens the dialog. */
export function AccountRowActions({ row, settings, types }: AccountRowActionsProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setOpen(true)}>{t("edit")}</DropdownMenuItem>
      </DataTableRowActions>
      <AccountDialog
        open={open}
        onOpenChange={setOpen}
        settings={settings}
        types={types}
        target={row.target}
      />
    </>
  );
}
