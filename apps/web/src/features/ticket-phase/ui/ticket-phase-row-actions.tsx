"use client";

import type { TicketPhaseDto } from "@okazi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveTicketPhaseDialog } from "./archive-ticket-phase-dialog";
import { MoveItems } from "./move-items";
import { TicketPhaseDialog } from "./ticket-phase-dialog";
import { TransitionsDialog } from "./transitions-dialog";

export type TicketPhaseRowActionsProps = {
  phase: TicketPhaseDto;
  index: number;
  phases: readonly TicketPhaseDto[];
};

type Dialog = "edit" | "transitions" | "archive";

/** Edit / transitions / move / archive for one phase. */
export function TicketPhaseRowActions({ phase, index, phases }: TicketPhaseRowActionsProps) {
  const t = useTranslations("ticketPhase");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDialog("transitions")}>
          {t("editTransitions")}
        </DropdownMenuItem>
        <MoveItems phases={phases} index={index} />
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <TicketPhaseDialog
        phase={phase}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
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
