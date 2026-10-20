"use client";

import type { LineDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveLineDialog } from "./archive-line-dialog";
import { LineDialog } from "./line-dialog";
import { LineStateMenu } from "./line-state-menu";
import type { ProgramFormData } from "./program-form-data";

/** Edit and remove follow `program:*`; changing a line's state and following the phase are `program:write` (ADR 0050). */
export type ProgramAccess = RowAccess & { canChangeState: boolean };

export type ProgramRowActionsProps = {
  line: LineDto;
  data: ProgramFormData;
  access: ProgramAccess;
};

/** Edit, change the state of and remove one row of the run schedule. */
export function ProgramRowActions({ line, data, access }: ProgramRowActionsProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        ) : null}
        {access.canChangeState ? <LineStateMenu line={line} states={data.states} /> : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <LineDialog
        data={data}
        ticketId={line.ticketId}
        startsAt={line.startsAt ?? new Date()}
        line={line}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveLineDialog
        line={line}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
