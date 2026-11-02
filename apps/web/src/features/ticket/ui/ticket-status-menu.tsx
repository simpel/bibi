"use client";

import type { TicketDto, TicketStatusDto } from "@bibi/core";
import {
  Button,
  ColorSwatch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChangeStatusDialog } from "./change-status-dialog";
import { TicketStatusLabel } from "./ticket-status-label";

export type TicketStatusMenuProps = {
  ticket: TicketDto;
  statuses: readonly TicketStatusDto[];
};

/** The statuses the organization allows from the ticket's current one, in board order. */
const statusTargets = ({ ticket, statuses }: TicketStatusMenuProps): TicketStatusDto[] => {
  const current = statuses.find(({ id }) => id === ticket.statusId);
  const allowed = new Set(current?.closes ? [] : (current?.transitionsTo ?? []));
  return statuses.filter(({ id }) => allowed.has(id));
};

/**
 * The ticket's status as a dropdown: picking a target opens the change-status dialog with it
 * chosen (reason and gates). A plain label when no transition leaves the current status.
 */
export function TicketStatusMenu({ ticket, statuses }: TicketStatusMenuProps) {
  const t = useTranslations("ticket");
  const [target, setTarget] = useState<string | null>(null);
  const targets = statusTargets({ ticket, statuses });
  const label = <TicketStatusLabel statuses={statuses} id={ticket.statusId} />;
  if (targets.length === 0) return label;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label={t("changeStatus")}>
            {label}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("changeStatus")}</DropdownMenuLabel>
          {targets.map((status) => (
            <DropdownMenuItem key={status.id} onSelect={() => setTarget(status.id)}>
              <ColorSwatch color={status.color} />
              {status.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangeStatusDialog
        ticket={ticket}
        targets={targets.map(({ id, name }) => ({ id, name }))}
        statusId={target ?? ""}
        open={target !== null}
        onOpenChange={(open) => (open ? null : setTarget(null))}
      />
    </>
  );
}
