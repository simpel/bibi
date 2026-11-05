"use client";

import { PinIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { Button } from "../button/button";
import { useCalendarLabels } from "./calendar-labels";
import type { AssetBooking } from "./calendar-types";
import { usePins } from "./pins-context";

export type BookingActionsProps = {
  booking: AssetBooking;
  onOpen?: (() => void) | undefined;
};

const iconClass = "size-7 shrink-0 text-muted-foreground hover:text-foreground";

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
      className={cn(iconClass, pinned && "text-primary hover:text-primary")}
      onClick={(e) => {
        e.stopPropagation();
        pins.toggle({ booking });
      }}
      aria-pressed={pinned}
      aria-label={pinned ? labels.unpin({ name }) : labels.pin({ name })}
      title={pinned ? labels.unpin({ name }) : labels.pin({ name })}
    >
      <PinIcon aria-hidden className={cn("size-3.5", pinned && "fill-current")} />
    </Button>
  );
}

/** Pin it to compare, then open its order. */
export function BookingActions({ booking, onOpen }: BookingActionsProps) {
  const labels = useCalendarLabels();
  return (
    <div className="-my-1 -mr-1 flex shrink-0 items-center gap-0.5">
      <PinButton booking={booking} />
      {onOpen && (booking.order || booking.orderId) ? (
        <Button
          size="icon"
          variant="ghost"
          className={iconClass}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={labels.open({ order: booking.order ?? booking.name })}
          title={labels.open({ order: booking.order ?? booking.name })}
        >
          <SquareArrowOutUpRightIcon aria-hidden className="size-3.5" />
        </Button>
      ) : booking.href ? (
        <Button
          asChild
          size="icon"
          variant="ghost"
          className={iconClass}
          onClick={(e) => e.stopPropagation()}
          aria-label={labels.open({ order: booking.order ?? booking.name })}
          title={labels.open({ order: booking.order ?? booking.name })}
        >
          <AppLink href={booking.href}>
            <SquareArrowOutUpRightIcon aria-hidden className="size-3.5" />
          </AppLink>
        </Button>
      ) : null}
    </div>
  );
}
