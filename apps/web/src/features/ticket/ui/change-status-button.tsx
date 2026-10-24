"use client";

import type { TicketDto, TicketStatusDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { ArrowRightLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { ChangeStatusDialog } from "./change-status-dialog";

export type ChangeStatusButtonProps = {
  ticket: TicketDto;
  statuses: readonly TicketStatusDto[];
};

/** The statuses the organization allows from the ticket's current one, in board order. */
const statusTargets = ({ ticket, statuses }: ChangeStatusButtonProps): NamedOption[] => {
  const current = statuses.find(({ id }) => id === ticket.statusId);
  const allowed = new Set(current?.closes ? [] : (current?.transitionsTo ?? []));
  return statuses.filter(({ id }) => allowed.has(id)).map(({ id, name }) => ({ id, name }));
};

/** Opens the change-status dialog; hidden when no transition leaves the current status. */
export function ChangeStatusButton({ ticket, statuses }: ChangeStatusButtonProps) {
  const t = useTranslations("ticket");
  const [open, setOpen] = useState(false);
  const targets = statusTargets({ ticket, statuses });
  if (targets.length === 0) return null;
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowRightLeftIcon />
        {t("changeStatus")}
      </Button>
      <ChangeStatusDialog ticket={ticket} targets={targets} open={open} onOpenChange={setOpen} />
    </>
  );
}
