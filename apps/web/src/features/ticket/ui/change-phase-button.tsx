"use client";

import type { TicketDto, TicketPhaseDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { ArrowRightLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { ChangePhaseDialog } from "./change-phase-dialog";

export type ChangePhaseButtonProps = {
  ticket: TicketDto;
  phases: readonly TicketPhaseDto[];
};

/** The phases the organization allows from the ticket's current one, in board order. */
const phaseTargets = ({ ticket, phases }: ChangePhaseButtonProps): NamedOption[] => {
  const current = phases.find(({ id }) => id === ticket.phaseId);
  const allowed = new Set(current?.terminal ? [] : (current?.transitionsTo ?? []));
  return phases.filter(({ id }) => allowed.has(id)).map(({ id, name }) => ({ id, name }));
};

/** Opens the change-phase dialog; hidden when no transition leaves the current phase. */
export function ChangePhaseButton({ ticket, phases }: ChangePhaseButtonProps) {
  const t = useTranslations("ticket");
  const [open, setOpen] = useState(false);
  const targets = phaseTargets({ ticket, phases });
  if (targets.length === 0) return null;
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowRightLeftIcon />
        {t("changePhase")}
      </Button>
      <ChangePhaseDialog ticket={ticket} targets={targets} open={open} onOpenChange={setOpen} />
    </>
  );
}
