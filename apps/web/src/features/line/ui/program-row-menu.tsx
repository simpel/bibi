"use client";

import type { LineDto } from "@bibi/core";
import {
  ColorSwatch,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LineStateOption } from "./line-state-option";
import type { ProgramAccess } from "./program-access";
import type { ProgramFormData } from "./program-form-data";

export type ProgramDialogType = "edit" | "addOn" | "units" | "archive" | null;

/** The menu parts a row's actions are drawn with: the right-click menu or the row's "…" menu. */
const KITS = {
  context: {
    Item: ContextMenuItem,
    Separator: ContextMenuSeparator,
    Sub: ContextMenuSub,
    SubTrigger: ContextMenuSubTrigger,
    SubContent: ContextMenuSubContent,
  },
  dropdown: {
    Item: DropdownMenuItem,
    Separator: DropdownMenuSeparator,
    Sub: DropdownMenuSub,
    SubTrigger: DropdownMenuSubTrigger,
    SubContent: DropdownMenuSubContent,
  },
};

export type ProgramRowMenuProps = {
  /** `context` for the right-click menu, `dropdown` for the row's "…" button; same actions. */
  kit: keyof typeof KITS;
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

/**
 * Every action on an order line, the same in the right-click menu and the row's "…" menu: edit
 * first (its choices too), then add an extra, units, state changes, and remove last.
 */
export function ProgramRowMenu({
  kit,
  line,
  data,
  access,
  onOpenDialog,
  onStateChange,
  onFollowStatus,
}: ProgramRowMenuProps) {
  const t = useTranslations("line");
  const { Item, Separator, Sub, SubTrigger, SubContent } = KITS[kit];
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
        <Item onSelect={() => onOpenDialog({ line, dialog: "edit" })}>
          <PencilIcon className="mr-2 size-4" />
          {t("edit")}
        </Item>
      ) : null}

      {canAddOn({ line, access }) ? (
        <Item onSelect={() => onOpenDialog({ line, dialog: "addOn" })}>{t("addAddOn")}</Item>
      ) : null}

      {canAllocate ? (
        <Item onSelect={() => onOpenDialog({ line, dialog: "units" })}>{t("units")}</Item>
      ) : null}

      {access.canChangeState && targets.length > 0 ? (
        <Sub>
          <SubTrigger>{t("changeState")}</SubTrigger>
          <SubContent>
            {targets.map((state: LineStateOption) => (
              <Item
                key={state.id}
                onSelect={() => onStateChange({ lineId: line.id, stateId: state.id })}
              >
                <ColorSwatch color={state.color} />
                <span>{state.name}</span>
              </Item>
            ))}
          </SubContent>
        </Sub>
      ) : null}

      {line.stateOverridden && access.canChangeState ? (
        <Item onSelect={() => onFollowStatus({ lineId: line.id })}>{t("followStatus")}</Item>
      ) : null}

      {access.canRemove ? (
        <>
          <Separator />
          <Item destructive onSelect={() => onOpenDialog({ line, dialog: "archive" })}>
            {t("archive")}
          </Item>
        </>
      ) : null}
    </>
  );
}
