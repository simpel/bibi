"use client";

import type { LineDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { LineAllocationsDialog } from "../../line-allocation/ui/line-allocations-dialog";
import { ArchiveLineDialog } from "./archive-line-dialog";
import { ChooseOptionsDialog } from "./choose-options-dialog";
import type { ExtraAddOn } from "./choose-options-extras";
import type { ChosenOption } from "./choose-options-schema";
import { LineDialog } from "./line-dialog";
import { LineStateMenu } from "./line-state-menu";
import type { ProgramFormData } from "./program-form-data";

/**
 * Edit and remove follow `program:*`; changing a line's state and following the status are
 * `program:write`; choosing a unit needs `program:write` and reading items (ADR 0050, 0059).
 */
export type ProgramAccess = RowAccess & { canChangeState: boolean; canAllocate: boolean };

export type ProgramRowActionsProps = {
  line: LineDto;
  data: ProgramFormData;
  access: ProgramAccess;
  /** The line's current option lines as chosen options. */
  chosen: readonly ChosenOption[];
  /** The line's add-ons that are extra picks of its groups (ADR 0088). */
  extras: readonly ExtraAddOn[];
};

type Dialogs = "edit" | "addOn" | "options" | "units" | "archive" | null;

/** The line's item, when it has customisation groups and the line is not an option itself. */
const customisableOf = ({ line, data }: Pick<ProgramRowActionsProps, "line" | "data">) =>
  line.role !== "OPTION"
    ? data.customisable.find(({ itemId }) => itemId === line.itemId)
    : undefined;

/** Only a top-level line takes add-ons (ADR 0088 decision 4). */
const canAddOn = ({ line, access }: Pick<ProgramRowActionsProps, "line" | "access">) =>
  access.canEdit && line.role === null;

type RowMenuProps = Omit<ProgramRowActionsProps, "chosen" | "extras"> & {
  canChoose: boolean;
  canAllocate: boolean;
  onOpen: (dialog: Dialogs) => void;
};

function RowMenu({ line, data, access, canChoose, canAllocate, onOpen }: RowMenuProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      {access.canEdit ? (
        <DropdownMenuItem onSelect={() => onOpen("edit")}>{t("edit")}</DropdownMenuItem>
      ) : null}
      {canAddOn({ line, access }) ? (
        <DropdownMenuItem onSelect={() => onOpen("addOn")}>{t("addAddOn")}</DropdownMenuItem>
      ) : null}
      {canChoose ? (
        <DropdownMenuItem onSelect={() => onOpen("options")}>{t("chooseOptions")}</DropdownMenuItem>
      ) : null}
      {canAllocate ? (
        <DropdownMenuItem onSelect={() => onOpen("units")}>{t("units")}</DropdownMenuItem>
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

type DialogState = { dialog: Dialogs; setDialog: (dialog: Dialogs) => void };

/** The `open` props of the dialog `name`: open while it is the one chosen in the menu. */
const bind = ({ dialog, setDialog, name }: DialogState & { name: Dialogs }) => ({
  open: dialog === name,
  onOpenChange: (open: boolean) => {
    if (!open) setDialog(null);
  },
});

type LineDialogsProps = Pick<ProgramRowActionsProps, "line" | "data"> &
  DialogState & { canAddOn: boolean };

/** Edit the line, or add an add-on under it (ADR 0088): the line dialog in its two modes. */
function LineDialogs({ line, data, canAddOn, ...state }: LineDialogsProps) {
  const base = { data, ticketId: line.ticketId, startsAt: line.startsAt ?? new Date() };
  return (
    <>
      <LineDialog {...base} line={line} {...bind({ ...state, name: "edit" })} />
      {canAddOn ? (
        <LineDialog {...base} parent={line} {...bind({ ...state, name: "addOn" })} />
      ) : null}
    </>
  );
}

/**
 * Edit, add an add-on to (top-level lines, ADR 0088), choose the options and the units of, change
 * the state of and remove one run schedule row.
 */
export function ProgramRowActions({ line, data, access, chosen, extras }: ProgramRowActionsProps) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const state = { dialog, setDialog };
  const customisable = access.canEdit ? customisableOf({ line, data }) : undefined;
  const canAllocate = access.canAllocate && line.itemId !== null && line.startsAt !== null;
  return (
    <>
      <RowMenu
        {...{ line, data, access, canAllocate }}
        canChoose={customisable !== undefined}
        onOpen={setDialog}
      />
      <LineDialogs {...{ line, data, ...state }} canAddOn={canAddOn({ line, access })} />
      {customisable ? (
        <ChooseOptionsDialog
          {...{ lineId: line.id, ticketId: line.ticketId, chosen, extras }}
          item={customisable}
          quantity={line.effectiveQuantity}
          {...bind({ ...state, name: "options" })}
        />
      ) : null}
      {canAllocate ? (
        <LineAllocationsDialog lineId={line.id} {...bind({ ...state, name: "units" })} />
      ) : null}
      <ArchiveLineDialog line={line} {...bind({ ...state, name: "archive" })} />
    </>
  );
}
