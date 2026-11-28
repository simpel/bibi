"use client";

import { Button, cn, StatusBadge } from "@bibi/ui";
import { ExternalLinkIcon, LockIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/navigation";
import type { PickColor } from "../lib/pick-colors";
import { NEXT_ACTIONS, type ReservationRow } from "../lib/reservation-row";
import { reservationRoute } from "../lib/routes";
import { useReservationState } from "./use-reservation-state";

export type TableTarget = { tableId: string; label: string; seats: number };

export type TablePanelProps = {
  target: TableTarget;
  /** Matches the ring on the floor. */
  color: PickColor;
  /** The reservation holding the table at the chosen time, if any. */
  held: ReservationRow | null;
  /** The chosen time as `19:00`. */
  timeLabel: string;
  canWrite: boolean;
  onClose: () => void;
  /** Free table: start a reservation here for this many people. */
  onCreateHere: (input: { tableId: string; party: number }) => void;
  /** Block this table: opens the block dialog with it picked. */
  onBlock: (target: TableTarget) => void;
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
                className="h-12 px-5 text-base"
                disabled={pending}
                onClick={() => change({ id: held.id, action })}
              >
                {t(`actions.${action}`)}
              </Button>
            ))
          : null}
        <Button asChild variant="outline" className="h-12 px-5 text-base">
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
  onCreateHere: TablePanelProps["onCreateHere"];
  onBlock: TablePanelProps["onBlock"];
};

function Free({ target, timeLabel, onCreateHere, onBlock }: FreeProps) {
  const t = useTranslations("reservation.popover");
  const [party, setParty] = useState(2);
  return (
    <div className="grid gap-3">
      <p className="text-lg text-muted-foreground">
        {t("free", { label: target.label, time: timeLabel })}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg">{t("party")}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="size-12"
            aria-label={t("fewer")}
            disabled={party <= 1}
            onClick={() => setParty(party - 1)}
          >
            <MinusIcon />
          </Button>
          <span className="w-10 text-center text-2xl tabular-nums">{party}</span>
          <Button
            variant="outline"
            className="size-12"
            aria-label={t("more")}
            disabled={party >= 100}
            onClick={() => setParty(party + 1)}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <Button
        className="h-14 text-lg"
        onClick={() => onCreateHere({ tableId: target.tableId, party })}
      >
        {t("seatHere")}
      </Button>
      <BlockButton target={target} onBlock={onBlock} />
    </div>
  );
}

function BlockButton({ target, onBlock }: Pick<FreeProps, "target" | "onBlock">) {
  const t = useTranslations("reservation.popover");
  return (
    <Button variant="outline" className="h-12 text-base" onClick={() => onBlock(target)}>
      <LockIcon />
      {t("block")}
    </Button>
  );
}

/** A tap on a table, shown over the left of the floor: who holds it, or seat guests. */
export function TablePanel({
  target,
  color,
  held,
  timeLabel,
  canWrite,
  onClose,
  onCreateHere,
  onBlock,
}: TablePanelProps) {
  const t = useTranslations("reservation.popover");
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl">
          <span aria-hidden className={cn("size-3 rounded-full", color.dot)} />
          {t("table", { label: target.label })}
        </h2>
        <Button
          variant="outline"
          className="size-12 shrink-0"
          aria-label={t("close")}
          onClick={onClose}
        >
          <XIcon className="size-5" />
        </Button>
      </div>
      {held ? (
        <Held held={held} canWrite={canWrite} onClose={onClose} />
      ) : canWrite ? (
        <Free target={target} timeLabel={timeLabel} onCreateHere={onCreateHere} onBlock={onBlock} />
      ) : null}
    </div>
  );
}
