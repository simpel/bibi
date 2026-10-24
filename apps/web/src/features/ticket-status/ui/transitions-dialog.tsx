import type { TicketStatusDto } from "@bibi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TransitionsForm } from "./transitions-form";

export type TransitionsDialogProps = {
  ticketStatus: TicketStatusDto;
  /** Every active status; the status itself is left out of the choices. */
  statuses: readonly TicketStatusDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Which statuses a ticket may move to from `status` (replaced as a set). */
export function TransitionsDialog({
  ticketStatus,
  statuses,
  open,
  onOpenChange,
}: TransitionsDialogProps) {
  const t = useTranslations("ticketStatus");
  const targets = statuses.filter((candidate) => candidate.id !== ticketStatus.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTransitions")}</DialogTitle>
          <DialogDescription>
            {t("transitionsDescription", { name: ticketStatus.name })}
          </DialogDescription>
        </DialogHeader>
        <TransitionsForm
          ticketStatus={ticketStatus}
          targets={targets}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
