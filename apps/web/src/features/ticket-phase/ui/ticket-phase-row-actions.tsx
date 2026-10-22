"use client";

import type { TicketPhaseDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveTicketPhaseDialog } from "./archive-ticket-phase-dialog";
import { EditTicketPhaseItem } from "./edit-ticket-phase-item";
import { MoveItems } from "./move-items";
import { TransitionsDialog } from "./transitions-dialog";

export type TicketPhaseRowActionsProps = {
  phase: TicketPhaseDto;
  index: number;
  phases: readonly TicketPhaseDto[];
  access: RowAccess;
};

type Dialog = "transitions" | "archive";

type MenuProps = TicketPhaseRowActionsProps & { onOpen: (dialog: Dialog) => void };

function PhaseMenu({ phase, index, phases, access, onOpen }: MenuProps) {
  const t = useTranslations("ticketPhase");
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      {access.canEdit ? (
        <>
          <EditTicketPhaseItem id={phase.id} />
          <DropdownMenuItem onSelect={() => onOpen("transitions")}>
            {t("editTransitions")}
          </DropdownMenuItem>
          <MoveItems phases={phases} index={index} />
        </>
      ) : null}
      {access.canRemove ? (
        <DropdownMenuItem destructive onSelect={() => onOpen("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** Edit (page) / transitions / move / archive for one phase. */
export function TicketPhaseRowActions(props: TicketPhaseRowActionsProps) {
  const { phase, phases } = props;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  return (
    <>
      <PhaseMenu {...props} onOpen={setDialog} />
      {dialog === "transitions" ? (
        <TransitionsDialog
          phase={phase}
          phases={phases}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      <ArchiveTicketPhaseDialog
        phase={phase}
        phases={phases}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
