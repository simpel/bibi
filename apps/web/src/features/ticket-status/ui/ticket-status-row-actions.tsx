"use client";

import type { TicketStatusDto } from "@bibi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveTicketStatusDialog } from "./archive-ticket-status-dialog";
import { EditTicketStatusItem } from "./edit-ticket-status-item";
import { MoveItems } from "./move-items";

export type TicketStatusRowActionsProps = {
  ticketStatus: TicketStatusDto;
  index: number;
  statuses: readonly TicketStatusDto[];
  access: RowAccess;
};

type MenuProps = TicketStatusRowActionsProps & { onArchive: () => void };

function StatusMenu({ ticketStatus, index, statuses, access, onArchive }: MenuProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  return (
    <DataTableRowActions label={common("actions")}>
      {access.canEdit ? (
        <>
          <EditTicketStatusItem id={ticketStatus.id} />
          <MoveItems statuses={statuses} index={index} />
        </>
      ) : null}
      {access.canRemove ? (
        <DropdownMenuItem destructive onSelect={onArchive}>
          {t("archive")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** Edit (page) / move / archive for one status; the flow has its own editor (ADR 0076). */
export function TicketStatusRowActions(props: TicketStatusRowActionsProps) {
  const { ticketStatus, statuses } = props;
  const [archiveOpen, setArchiveOpen] = useState(false);
  return (
    <>
      <StatusMenu {...props} onArchive={() => setArchiveOpen(true)} />
      <ArchiveTicketStatusDialog
        ticketStatus={ticketStatus}
        statuses={statuses}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
    </>
  );
}
