"use client";

import type { TicketStatusDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveTicketStatusDialog } from "./archive-ticket-status-dialog";
import { EditTicketStatusItem } from "./edit-ticket-status-item";
import { MoveItems } from "./move-items";
import { TransitionsDialog } from "./transitions-dialog";

export type TicketStatusRowActionsProps = {
  ticketStatus: TicketStatusDto;
  index: number;
  statuses: readonly TicketStatusDto[];
  access: RowAccess;
};

type Dialog = "transitions" | "archive";

type MenuProps = TicketStatusRowActionsProps & { onOpen: (dialog: Dialog) => void };

function StatusMenu({ ticketStatus, index, statuses, access, onOpen }: MenuProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      {access.canEdit ? (
        <>
          <EditTicketStatusItem id={ticketStatus.id} />
          <DropdownMenuItem onSelect={() => onOpen("transitions")}>
            {t("editTransitions")}
          </DropdownMenuItem>
          <MoveItems statuses={statuses} index={index} />
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

/** Edit (page) / transitions / move / archive for one status. */
export function TicketStatusRowActions(props: TicketStatusRowActionsProps) {
  const { ticketStatus, statuses } = props;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  return (
    <>
      <StatusMenu {...props} onOpen={setDialog} />
      {dialog === "transitions" ? (
        <TransitionsDialog
          ticketStatus={ticketStatus}
          statuses={statuses}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      <ArchiveTicketStatusDialog
        ticketStatus={ticketStatus}
        statuses={statuses}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
