"use client";

import type { SetupDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveSetupDialog } from "./archive-setup-dialog";
import { SetupDialog } from "./setup-dialog";

export type SetupRowActionsProps = { setup: SetupDto; access: RowAccess };

/** Edit / archive menu for one setup. */
export function SetupRowActions({ setup, access }: SetupRowActionsProps) {
  const t = useTranslations("setup");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
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
