"use client";

import type { LineDto } from "@bibi/core";
import { LineAllocationsDialog } from "../../line-allocation/ui/line-allocations-dialog";
import { useLineAllocations } from "../../line-allocation/ui/use-line-allocations";
import { ArchiveLineDialog } from "./archive-line-dialog";
import { chosenOptions } from "./choose-options-schema";
import { LineDialog } from "./line-dialog";
import type { ProgramAccess } from "./program-access";
import type { ProgramFormData } from "./program-form-data";
import type { ItemLock } from "./program-item-field";
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

/** Why a line's item cannot change: a part or option keeps it, so does a line that has them. */
function itemLockOf({ line, lines }: { line: LineDto; lines: LineDto[] }): ItemLock {
  if (line.role === "PART") return "part";
  if (line.role === "OPTION") return "option";
  const made = lines.some(
    (other) =>
      other.parentLineId === line.id &&
      other.status === "ACTIVE" &&
      (other.role === "PART" || other.role === "OPTION"),
  );
  return made ? "parent" : null;
}

/**
 * Manages the modal dialogs for the program table rows:
 * edit line (with its choices), add an extra, unit allocations, and archive.
 */
export function ProgramDialogs({ active, onClose, data, lines, access }: ProgramDialogsProps) {
  const line = active?.line;
  const dialog = active?.dialog;

  const allocations = useLineAllocations({ lineId: line?.id ?? "" });
  const customisable = line && access.canEdit ? customisableOf({ line, data }) : undefined;
  const chosen = line ? chosenOptions({ line, lines }) : [];
  const itemLock = line ? itemLockOf({ line, lines }) : null;

  if (!line || !dialog) return null;

  const base = { data, orderId: line.orderId, startsAt: line.startsAt ?? new Date() };

  return (
    <>
      <LineDialog
        {...base}
        line={line}
        itemLock={itemLock}
        choices={
          customisable
            ? { item: customisable, chosen, quantity: line.effectiveQuantity }
            : undefined
        }
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
