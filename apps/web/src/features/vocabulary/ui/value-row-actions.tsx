"use client";

import type { VocabularyValueDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RowAccess } from "@/lib/can";

export type ValueAction = { kind: "edit" | "archive"; value: VocabularyValueDto };

export type ValueRowActionsProps = {
  value: VocabularyValueDto;
  access: RowAccess;
  /** Opens the dialog; it lives in the table so a context menu can open it too. */
  onAction: (action: ValueAction) => void;
};

/** Rename / archive menu for one list value. */
export function ValueRowActions({ value, access, onAction }: ValueRowActionsProps) {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        access.canEdit
          ? [
              {
                label: t("edit"),
                icon: PencilIcon,
                onClick: () => onAction({ kind: "edit", value }),
              },
            ]
          : []
      }
    >
      {access.canRemove ? (
        <DropdownMenuItem destructive onSelect={() => onAction({ kind: "archive", value })}>
          {t("archive")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** Right-click menu of one value, mirroring the row actions. */
export function ValueRowMenu({ value, access, onAction }: ValueRowActionsProps) {
  const t = useTranslations("vocabulary.value");
  return (
    <>
      {access.canEdit ? (
        <ContextMenuItem onSelect={() => onAction({ kind: "edit", value })}>
          <PencilIcon />
          {t("edit")}
        </ContextMenuItem>
      ) : null}
      {access.canRemove ? (
        <ContextMenuItem destructive onSelect={() => onAction({ kind: "archive", value })}>
          <ArchiveIcon />
          {t("archive")}
        </ContextMenuItem>
      ) : null}
    </>
  );
}
