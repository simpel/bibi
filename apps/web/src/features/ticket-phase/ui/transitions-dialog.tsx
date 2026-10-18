import type { TicketPhaseDto } from "@okazi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TransitionsForm } from "./transitions-form";

export type TransitionsDialogProps = {
  phase: TicketPhaseDto;
  /** Every active phase; the phase itself is left out of the choices. */
  phases: readonly TicketPhaseDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Which phases a ticket may move to from `phase` (replaced as a set). */
export function TransitionsDialog({ phase, phases, open, onOpenChange }: TransitionsDialogProps) {
  const t = useTranslations("ticketPhase");
  const targets = phases.filter((candidate) => candidate.id !== phase.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTransitions")}</DialogTitle>
          <DialogDescription>{t("transitionsDescription", { name: phase.name })}</DialogDescription>
        </DialogHeader>
        <TransitionsForm phase={phase} targets={targets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
