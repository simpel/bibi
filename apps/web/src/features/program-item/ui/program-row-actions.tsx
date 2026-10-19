"use client";

import type { ProgramItemDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveProgramItemDialog } from "./archive-program-item-dialog";
import { LineStateMenu } from "./line-state-menu";
import type { ProgramFormData } from "./program-form-data";
import { ProgramItemDialog } from "./program-item-dialog";

/** Edit and remove follow `program:*`; changing a line's state and following the phase are `program:edit` (ADR 0050). */
export type ProgramAccess = RowAccess & { canChangeState: boolean };

export type ProgramRowActionsProps = {
  programItem: ProgramItemDto;
  data: ProgramFormData;
  access: ProgramAccess;
};

/** Edit, change the state of and remove one row of the run schedule. */
export function ProgramRowActions({ programItem, data, access }: ProgramRowActionsProps) {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        ) : null}
        {access.canChangeState ? (
          <LineStateMenu programItem={programItem} states={data.states} />
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ProgramItemDialog
        data={data}
        ticketId={programItem.ticketId}
        startsAt={programItem.startsAt}
        programItem={programItem}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveProgramItemDialog
        programItem={programItem}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
