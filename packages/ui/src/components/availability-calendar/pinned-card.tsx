"use client";

import { Maximize2Icon, Minimize2Icon, SquareArrowOutUpRightIcon, XIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { CalendarHoverDetails } from "../cursor-hover/cursor-hover-details";
import { formatDay } from "./calendar-dates";
import { useCalendarLabels } from "./calendar-labels";
import type { PinnedBookingsProps } from "./pinned-bookings";
import { PinnedValue } from "./pinned-facts";
import type { PinnedBooking } from "./pins-context";

export type PinnedCardProps = Pick<PinnedBookingsProps, "formatDate"> & {
  booking: PinnedBooking;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onOpen?: (() => void) | undefined;
};

/** Controls pinned to the top right: Open order, Minimize/Maximize, and Close. */
function Controls({ booking, minimized, onMinimize, onClose, onOpen }: PinnedCardProps) {
  const labels = useCalendarLabels();
  const name = booking.customer ?? booking.name;
  const toggle = minimized ? labels.pinCard.expand({ name }) : labels.pinCard.minimize({ name });
  const close = labels.unpin({ name });
  return (
    <div className="flex shrink-0 items-center gap-1">
      {onOpen && !minimized && booking.order ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={onOpen}
          aria-label={labels.pinCard.seeOrder}
          title={labels.pinCard.seeOrder}
        >
          <SquareArrowOutUpRightIcon aria-hidden className="size-3.5" />
        </Button>
      ) : null}
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={onMinimize}
        aria-expanded={!minimized}
        aria-label={toggle}
        title={toggle}
      >
        {minimized ? (
          <Maximize2Icon aria-hidden className="size-3.5" />
        ) : (
          <Minimize2Icon aria-hidden className="size-3.5" />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={onClose}
        aria-label={close}
        title={close}
      >
        <XIcon aria-hidden className="size-3.5" />
      </Button>
    </div>
  );
}

function MinimizedHeader(props: PinnedCardProps) {
  const { booking } = props;
  return (
    <div className="relative min-h-[1.75rem]">
      <div className="pr-16">
        <p className="truncate font-semibold text-xs leading-snug text-foreground">
          {booking.customer ?? booking.name}
        </p>
        {booking.value ? (
          <PinnedValue booking={booking} className="text-[11px] text-muted-foreground mt-0.5" />
        ) : null}
      </div>
      <div className="absolute top-0 right-0 flex items-center gap-1">
        <Controls {...props} />
      </div>
    </div>
  );
}

/**
 * A pinned booking in the tray: shares the unified layout with calendar hover cards.
 * Minimized, it keeps only the client and value; expanded, it shows the full unified card.
 */
export function PinnedCard(props: PinnedCardProps) {
  const { booking, minimized, onOpen, formatDate } = props;
  const dateStr = formatDay({ date: booking.date, format: formatDate, year: true });

  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border bg-popover/95 p-3.5 text-xs text-popover-foreground shadow-2xl backdrop-blur-md transition-all",
        minimized ? "w-56 p-3" : "w-[23.5rem] max-w-[calc(100vw-2rem)]",
      )}
    >
      {minimized ? (
        <MinimizedHeader {...props} />
      ) : (
        <CalendarHoverDetails
          booking={booking}
          date={dateStr}
          onOpen={onOpen}
          headerActions={<Controls {...props} />}
        />
      )}
    </div>
  );
}
