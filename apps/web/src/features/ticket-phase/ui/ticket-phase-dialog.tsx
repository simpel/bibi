import type { TicketPhaseDto } from "@okazi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TicketPhaseForm } from "./ticket-phase-form";

export type TicketPhaseDialogProps = {
  /** Present = edit mode, absent = create mode. */
  phase?: TicketPhaseDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TicketPhaseDialog({ phase, open, onOpenChange }: TicketPhaseDialogProps) {
  const t = useTranslations("ticketPhase");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{phase ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {phase ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <TicketPhaseForm phase={phase} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
