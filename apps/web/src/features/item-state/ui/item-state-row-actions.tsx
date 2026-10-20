"use client";

import type { ItemStateDto } from "@okazi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveItemStateDialog } from "./archive-item-state-dialog";
import { ItemStateTransitionsDialog } from "./item-state-transitions-dialog";
import { EditStateItem, MoveStateItems } from "./state-menu-items";

export type ItemStateRowActionsProps = {
  state: ItemStateDto;
  index: number;
  /** The type's active states in order. */
  states: readonly ItemStateDto[];
  access: RowAccess;
};

type Dialog = "transitions" | "archive";

/** Edit (page) / transitions / move / archive for one state. */
export function ItemStateRowActions({ state, index, states, access }: ItemStateRowActionsProps) {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <>
            <EditStateItem id={state.id} />
            <DropdownMenuItem onSelect={() => setDialog("transitions")}>
              {t("editTransitions")}
            </DropdownMenuItem>
            <MoveStateItems states={states} index={index} />
          </>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      {dialog === "transitions" ? (
        <ItemStateTransitionsDialog
          state={state}
          states={states}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      <ArchiveItemStateDialog
        state={state}
        states={states}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
