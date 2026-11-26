"use client";

import { Button, Popover, PopoverAnchor, PopoverContent, StatusBadge } from "@bibi/ui";
import { ExternalLinkIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/navigation";
import { NEXT_ACTIONS, type ReservationRow } from "../lib/reservation-row";
import { reservationRoute } from "../lib/routes";
import { useReservationState } from "./use-reservation-state";

export type TableTarget = { tableId: string; label: string; seats: number; x: number; y: number };

export type TablePopoverProps = {
  target: TableTarget | null;
  /** The reservation holding the table at the chosen time, if any. */
  held: ReservationRow | null;
  /** The chosen time as `19:00`. */
  timeLabel: string;
  canWrite: boolean;
  onClose: () => void;
  /** Free table: start a reservation here for this many people. */
  onCreateHere: (input: { tableId: string; party: number }) => void;
};

type HeldProps = { held: ReservationRow; canWrite: boolean; onClose: () => void };

function Held({ held, canWrite, onClose }: HeldProps) {
  const t = useTranslations("reservation");
  const { change, pending } = useReservationState({ onDone: onClose });
  const quick = NEXT_ACTIONS[held.state].filter(
    (action): action is "seat" | "complete" => action === "seat" || action === "complete",
  );
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid">
          <span className="font-medium">{held.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {held.time} · {t("detail.guests", { count: held.partySize })}
          </span>
        </div>
        <StatusBadge label={held.stateLabel} />
      </div>
      {held.needs ? <p className="text-sm">{held.needs}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {canWrite
          ? quick.map((action) => (
              <Button
                key={action}
                disabled={pending}
                onClick={() => change({ id: held.id, action })}
              >
                {t(`actions.${action}`)}
              </Button>
            ))
          : null}
        <Button asChild variant="outline">
          <Link href={reservationRoute({ id: held.id })}>
            <ExternalLinkIcon />
            {t("popover.open")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

type FreeProps = {
  target: TableTarget;
  timeLabel: string;
  onCreateHere: TablePopoverProps["onCreateHere"];
};

function Free({ target, timeLabel, onCreateHere }: FreeProps) {
  const t = useTranslations("reservation.popover");
  const [party, setParty] = useState(2);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        {t("free", { label: target.label, time: timeLabel })}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{t("party")}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("fewer")}
            disabled={party <= 1}
            onClick={() => setParty(party - 1)}
          >
            <MinusIcon />
          </Button>
          <span className="w-8 text-center text-lg tabular-nums">{party}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("more")}
            disabled={party >= 100}
            onClick={() => setParty(party + 1)}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <Button size="lg" onClick={() => onCreateHere({ tableId: target.tableId, party })}>
        {t("seatHere")}
      </Button>
    </div>
  );
}

/** A click on a table: its reservation with quick steps, or one big button to seat guests. */
export function TablePopover({
  target,
  held,
  timeLabel,
  canWrite,
  onClose,
  onCreateHere,
}: TablePopoverProps) {
  return (
    <Popover open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <PopoverAnchor asChild>
        <span
          aria-hidden
          className="pointer-events-none absolute size-0"
          style={{ left: target?.x ?? 0, top: target?.y ?? 0 }}
        />
      </PopoverAnchor>
      <PopoverContent className="w-80 font-sans" align="center">
        {target ? (
          held ? (
            <Held held={held} canWrite={canWrite} onClose={onClose} />
          ) : canWrite ? (
            <Free target={target} timeLabel={timeLabel} onCreateHere={onCreateHere} />
          ) : null
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
