"use client";

import type { SetupDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveSetupDialog } from "./archive-setup-dialog";
import { SetupDialog } from "./setup-dialog";

export type SetupRowActionsProps = { setup: SetupDto };

/** Edit / archive menu for one setup. */
export function SetupRowActions({ setup }: SetupRowActionsProps) {
  const t = useTranslations("setup");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <SetupDialog
        setup={setup}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveSetupDialog
        setup={setup}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
