"use client";

import { PinIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { useCalendarLabels } from "./calendar-labels";
import type { AssetBooking } from "./calendar-types";
import { usePins } from "./pins-context";

export type BookingActionsProps = {
  booking: AssetBooking;
  onOpen?: (() => void) | undefined;
};

const iconClass = "size-8 shrink-0";

/** Pins the booking to the tray at the bottom, or takes it off. */
function PinButton({ booking }: Pick<BookingActionsProps, "booking">) {
  const labels = useCalendarLabels();
  const pins = usePins();
  const name = booking.customer ?? booking.name;
  if (!pins) return null;
  const pinned = pins.isPinned({ id: booking.id });
  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(iconClass, pinned && "text-primary")}
      onClick={() => pins.toggle({ booking })}
      aria-pressed={pinned}
      aria-label={labels.pin({ name })}
      title={pinned ? labels.unpin({ name }) : labels.pin({ name })}
    >
      <PinIcon aria-hidden className={cn(pinned && "fill-current")} />
    </Button>
  );
}

/** Pin it to compare, then open its ticket. */
export function BookingActions({ booking, onOpen }: BookingActionsProps) {
  const labels = useCalendarLabels();
  return (
    <div className="-my-1 -mr-1.5 flex shrink-0">
      <PinButton booking={booking} />
      {onOpen && booking.ticket ? (
        <Button
          size="icon"
          variant="ghost"
          className={iconClass}
          onClick={onOpen}
          aria-label={labels.open({ ticket: booking.ticket })}
          title={labels.open({ ticket: booking.ticket })}
        >
          <SquareArrowOutUpRightIcon aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
