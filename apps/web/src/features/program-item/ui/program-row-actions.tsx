"use client";

import type { ProgramItemDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveProgramItemDialog } from "./archive-program-item-dialog";
import { LineStateMenu } from "./line-state-menu";
import type { ProgramFormData } from "./program-form-data";
import { ProgramItemDialog } from "./program-item-dialog";

export type ProgramRowActionsProps = { programItem: ProgramItemDto; data: ProgramFormData };

/** Edit, change the state of and remove one row of the run schedule. */
export function ProgramRowActions({ programItem, data }: ProgramRowActionsProps) {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <LineStateMenu programItem={programItem} states={data.states} />
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
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
