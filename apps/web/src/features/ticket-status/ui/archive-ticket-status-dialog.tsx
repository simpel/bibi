import type { TicketStatusDto } from "@bibi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ArchiveTicketStatusForm } from "./archive-ticket-status-form";

export type ArchiveTicketStatusDialogProps = {
  ticketStatus: TicketStatusDto;
  statuses: readonly TicketStatusDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive a status (ADR 0043): a status that holds tickets needs a target status for them. */
export function ArchiveTicketStatusDialog({
  ticketStatus,
  statuses,
  open,
  onOpenChange,
}: ArchiveTicketStatusDialogProps) {
  const t = useTranslations("ticketStatus");
  const targets = statuses.filter(({ id }) => id !== ticketStatus.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("archive")}</DialogTitle>
          <DialogDescription>{t("archiveConfirm", { name: ticketStatus.name })}</DialogDescription>
        </DialogHeader>
        <ArchiveTicketStatusForm
          status={ticketStatus}
          targets={targets}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
