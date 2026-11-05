"use client";

import type { LineDto } from "@bibi/core";
import { LineAllocationsDialog } from "../../line-allocation/ui/line-allocations-dialog";
import { useLineAllocations } from "../../line-allocation/ui/use-line-allocations";
import { ArchiveLineDialog } from "./archive-line-dialog";
import { ChooseOptionsDialog } from "./choose-options-dialog";
import { chosenOptions } from "./choose-options-schema";
import { LineDialog } from "./line-dialog";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";
import type { ProgramDialogType } from "./program-row-menu";

export type ProgramDialogsProps = {
  active: { line: LineDto; dialog: ProgramDialogType } | null;
  onClose: () => void;
  data: ProgramFormData;
  lines: LineDto[];
  access: ProgramAccess;
};

const customisableOf = ({ line, data }: { line: LineDto; data: ProgramFormData }) =>
  line.role !== "OPTION"
    ? data.customisable.find(({ itemId }) => itemId === line.itemId)
    : undefined;

/**
 * Manages the modal dialogs for the program table rows:
 * edit line, add add-on, choose options, unit allocations, and archive.
 */
export function ProgramDialogs({ active, onClose, data, lines, access }: ProgramDialogsProps) {
  const line = active?.line;
  const dialog = active?.dialog;

  const allocations = useLineAllocations({ lineId: line?.id ?? "" });
  const customisable = line && access.canEdit ? customisableOf({ line, data }) : undefined;
  const chosen = line ? chosenOptions({ line, lines }) : [];

  if (!line || !dialog) return null;

  const base = { data, orderId: line.orderId, startsAt: line.startsAt ?? new Date() };

  return (
    <>
      <LineDialog
        {...base}
        line={line}
        open={dialog === "edit"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      />

      <LineDialog
        {...base}
        parent={line}
        open={dialog === "addOn"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      />

      {customisable ? (
        <ChooseOptionsDialog
          lineId={line.id}
          chosen={chosen}
          item={customisable}
          quantity={line.effectiveQuantity}
          open={dialog === "options"}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />
      ) : null}

      <LineAllocationsDialog
        allocations={allocations}
        open={dialog === "units"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      />

      <ArchiveLineDialog
        line={line}
        open={dialog === "archive"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      />
    </>
  );
}
