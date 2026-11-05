"use client";

import type { LineDto } from "@bibi/core";
import {
  ColorSwatch,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LineStateOption } from "./line-state-option";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";

export type ProgramDialogType = "edit" | "addOn" | "options" | "units" | "archive" | null;

export type ProgramRowMenuProps = {
  line: LineDto;
  data: ProgramFormData;
  access: ProgramAccess;
  onOpenDialog: (input: { line: LineDto; dialog: ProgramDialogType }) => void;
  onStateChange: (input: { lineId: string; stateId: string }) => void;
  onFollowStatus: (input: { lineId: string }) => void;
};

/** Only a top-level line takes add-ons (ADR 0088 decision 4). */
const canAddOn = ({ line, access }: Pick<ProgramRowMenuProps, "line" | "access">) =>
  access.canEdit && line.role === null;

/** The line's item, when it has customisation groups and the line is not an option itself. */
const customisableOf = ({ line, data }: Pick<ProgramRowMenuProps, "line" | "data">) =>
  line.role !== "OPTION"
    ? data.customisable.find(({ itemId }) => itemId === line.itemId)
    : undefined;

/**
 * Full right-click context menu for an order line row.
 * Edit comes first, followed by add-on, options, units, state changes, and archive.
 */
export function ProgramRowMenu({
  line,
  data,
  access,
  onOpenDialog,
  onStateChange,
  onFollowStatus,
}: ProgramRowMenuProps) {
  const t = useTranslations("line");
  const customisable = access.canEdit ? customisableOf({ line, data }) : undefined;
  const canAllocate = access.canAllocate && line.itemId !== null && line.startsAt !== null;

  const current = data.states.find((s) => s.id === line.stateId);
  const availableStates = data.states.filter(
    (s) => !line.entityTypeId || s.entityTypeId === line.entityTypeId,
  );
  const targets =
    current && current.transitionsTo.length > 0
      ? availableStates.filter((s) => current.transitionsTo.includes(s.id))
      : availableStates;

  return (
    <>
      {access.canEdit ? (
        <ContextMenuItem onSelect={() => onOpenDialog({ line, dialog: "edit" })}>
          <PencilIcon className="mr-2 size-4" />
          {t("edit")}
        </ContextMenuItem>
      ) : null}

      {canAddOn({ line, access }) ? (
        <ContextMenuItem onSelect={() => onOpenDialog({ line, dialog: "addOn" })}>
          {t("addAddOn")}
        </ContextMenuItem>
      ) : null}

      {customisable ? (
        <ContextMenuItem onSelect={() => onOpenDialog({ line, dialog: "options" })}>
          {t("chooseOptions")}
        </ContextMenuItem>
      ) : null}

      {canAllocate ? (
        <ContextMenuItem onSelect={() => onOpenDialog({ line, dialog: "units" })}>
          {t("units")}
        </ContextMenuItem>
      ) : null}

      {access.canChangeState && targets.length > 0 ? (
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t("changeState")}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {targets.map((state: LineStateOption) => (
              <ContextMenuItem
                key={state.id}
                onSelect={() => onStateChange({ lineId: line.id, stateId: state.id })}
              >
                <ColorSwatch color={state.color} />
                <span>{state.name}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      ) : null}

      {line.stateOverridden && access.canChangeState ? (
        <ContextMenuItem onSelect={() => onFollowStatus({ lineId: line.id })}>
          {t("followStatus")}
        </ContextMenuItem>
      ) : null}

      {access.canRemove ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem destructive onSelect={() => onOpenDialog({ line, dialog: "archive" })}>
            {t("archive")}
          </ContextMenuItem>
        </>
      ) : null}
    </>
  );
}
