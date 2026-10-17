"use client";

import type { OptionDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { releaseOptionAction } from "../actions";

export type OptionRowActionsProps = { option: OptionDto };

/** Release menu; the options behind this one move up and the page reloads. */
export function OptionRowActions({ option }: OptionRowActionsProps) {
  const t = useTranslations("option");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setOpen(true)}>{t("release")}</DropdownMenuItem>
      </DataTableRowActions>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        label={t("release")}
        description={t("releaseConfirm")}
        messages={{ pending: t("releasing"), success: t("released") }}
        action={() => releaseOptionAction({ id: option.id })}
      />
    </>
  );
}
