"use client";

import type { LineDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveLineDialog } from "./archive-line-dialog";
import { ChooseOptionsDialog } from "./choose-options-dialog";
import { LineDialog } from "./line-dialog";
import { LineStateMenu } from "./line-state-menu";
import type { ProgramFormData } from "./program-form-data";

/** Edit and remove follow `program:*`; changing a line's state and following the phase are `program:write` (ADR 0050). */
export type ProgramAccess = RowAccess & { canChangeState: boolean };

export type ProgramRowActionsProps = {
  line: LineDto;
  data: ProgramFormData;
  access: ProgramAccess;
  /** The item ids of the line's current option lines. */
  chosen: readonly string[];
};

type Dialogs = "edit" | "options" | "archive" | null;

/** The line's item, when it has customisation groups and the line is not an option itself. */
const customisableOf = ({ line, data }: Pick<ProgramRowActionsProps, "line" | "data">) =>
  line.priceEffect === null
    ? data.customisable.find(({ itemId }) => itemId === line.itemId)
    : undefined;

type RowMenuProps = Omit<ProgramRowActionsProps, "chosen"> & {
  canChoose: boolean;
  onOpen: (dialog: Dialogs) => void;
};

function RowMenu({ line, data, access, canChoose, onOpen }: RowMenuProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      {access.canEdit ? (
        <DropdownMenuItem onSelect={() => onOpen("edit")}>{t("edit")}</DropdownMenuItem>
      ) : null}
      {canChoose ? (
        <DropdownMenuItem onSelect={() => onOpen("options")}>{t("chooseOptions")}</DropdownMenuItem>
      ) : null}
      {access.canChangeState ? <LineStateMenu line={line} states={data.states} /> : null}
      {access.canRemove ? (
        <DropdownMenuItem destructive onSelect={() => onOpen("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** Edit, choose the options of, change the state of and remove one row of the run schedule. */
export function ProgramRowActions({ line, data, access, chosen }: ProgramRowActionsProps) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const customisable = access.canEdit ? customisableOf({ line, data }) : undefined;
  return (
    <>
      <RowMenu
        {...{ line, data, access }}
        canChoose={customisable !== undefined}
        onOpen={setDialog}
      />
      <LineDialog
        data={data}
        ticketId={line.ticketId}
        startsAt={line.startsAt ?? new Date()}
        line={line}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      {customisable ? (
        <ChooseOptionsDialog
          lineId={line.id}
          item={customisable}
          chosen={chosen}
          open={dialog === "options"}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      <ArchiveLineDialog
        line={line}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
