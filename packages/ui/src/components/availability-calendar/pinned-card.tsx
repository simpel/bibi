"use client";

import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { useCalendarLabels } from "./calendar-labels";
import type { PinnedBookingsProps } from "./pinned-bookings";
import { PinnedFacts, PinnedValue } from "./pinned-facts";
import type { PinnedBooking } from "./pins-context";

export type PinnedCardProps = Pick<PinnedBookingsProps, "formatDate"> & {
  booking: PinnedBooking;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onOpen?: (() => void) | undefined;
};

/** Minimize and close, side by side at the top right. */
function Controls({ booking, minimized, onMinimize, onClose }: PinnedCardProps) {
  const labels = useCalendarLabels();
  const name = booking.customer ?? booking.name;
  const toggle = minimized ? labels.pinCard.expand({ name }) : labels.pinCard.minimize({ name });
  const close = labels.unpin({ name });
  return (
    <div className="-my-1 -mr-1.5 flex shrink-0">
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={onMinimize}
        aria-expanded={!minimized}
        aria-label={toggle}
        title={toggle}
      >
        {minimized ? <Maximize2Icon aria-hidden /> : <Minimize2Icon aria-hidden />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={onClose}
        aria-label={close}
        title={close}
      >
        <XIcon aria-hidden />
      </Button>
    </div>
  );
}

/** Who it is for and the ticket, then the controls; minimized, the value comes along. */
function Header(props: PinnedCardProps) {
  const { booking, minimized } = props;
  return (
    <div className="flex items-start gap-2">
      <div className="grid min-w-0 flex-1">
        <p className="truncate font-medium">{booking.customer ?? booking.name}</p>
        {minimized ? (
          <PinnedValue booking={booking} className="text-xs text-muted-foreground" />
        ) : booking.ticket ? (
          <p className="text-xs text-muted-foreground">{booking.ticket}</p>
        ) : null}
      </div>
      <Controls {...props} />
    </div>
  );
}

/**
 * A pinned booking: its main facts to read next to others, and the way to its ticket. Minimized
 * it keeps only the client and the value; it stays pinned until its X. Actions sit on the right.
 */
export function PinnedCard(props: PinnedCardProps) {
  const { booking, minimized, onOpen } = props;
  const labels = useCalendarLabels();
  return (
    <div
      className={cn(
        "shrink-0 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg",
        minimized ? "w-56" : "w-72",
      )}
    >
      <Header {...props} />
      {minimized ? null : (
        <div className="mt-3 grid gap-3">
          <PinnedFacts {...props} />
          {onOpen && booking.ticket ? (
            <Button variant="outline" size="sm" className="justify-self-end" onClick={onOpen}>
              {labels.pinCard.seeTicket}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
