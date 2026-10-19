"use client";

import type { LineDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveLineDialog } from "./archive-line-dialog";
import { LineDialog } from "./line-dialog";
import { LineStateMenu } from "./line-state-menu";
import type { ProgramFormData } from "./program-form-data";

export type ProgramRowActionsProps = { line: LineDto; data: ProgramFormData };

/** Edit, change the state of and remove one row of the run schedule. */
export function ProgramRowActions({ line, data }: ProgramRowActionsProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <LineStateMenu line={line} states={data.states} />
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <LineDialog
        data={data}
        ticketId={line.ticketId}
        startsAt={line.startsAt}
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
