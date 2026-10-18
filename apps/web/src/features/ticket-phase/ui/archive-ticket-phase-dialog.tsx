import type { TicketPhaseDto } from "@okazi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ArchiveTicketPhaseForm } from "./archive-ticket-phase-form";

export type ArchiveTicketPhaseDialogProps = {
  phase: TicketPhaseDto;
  phases: readonly TicketPhaseDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive a phase (ADR 0043): a phase that holds tickets needs a target phase for them. */
export function ArchiveTicketPhaseDialog({
  phase,
  phases,
  open,
  onOpenChange,
}: ArchiveTicketPhaseDialogProps) {
  const t = useTranslations("ticketPhase");
  const targets = phases.filter(({ id }) => id !== phase.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("archive")}</DialogTitle>
          <DialogDescription>{t("archiveConfirm", { name: phase.name })}</DialogDescription>
        </DialogHeader>
        <ArchiveTicketPhaseForm
          phase={phase}
          targets={targets}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
