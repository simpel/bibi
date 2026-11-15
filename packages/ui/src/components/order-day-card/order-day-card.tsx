"use client";

import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useOptionalCalendarLabels } from "../availability-calendar/calendar-labels";
import type { PinnedBooking } from "../availability-calendar/pins-context";
import { type BookingTone, bookingToneVariants } from "../booking-tone/booking-tone";
import { Button } from "../button/button";
import { CalendarHoverDetails } from "../cursor-hover/cursor-hover-details";
import { PinAction } from "../cursor-hover/hover-actions";
import type { OrderViewFact } from "../order-view/order-view";

export type OrderDayCardProps = {
  /** The order's day as a booking, so it renders and pins like a calendar booking. */
  booking: PinnedBooking;
  href: string;
  tone: BookingTone;
  /** A tiny line above the time, e.g. the date or "Day 2 of 3". */
  date: string;
  subtitle?: string | undefined;
  /** The bottom row, e.g. Live and the most urgent flag; above the card's link. */
  footer?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  /** The order's facts, shown while expanded. */
  facts?: readonly OrderViewFact[] | undefined;
  className?: string;
};

function ExpandButton({
  booking,
  expanded,
  onToggle,
}: Pick<OrderDayCardProps, "booking" | "expanded" | "onToggle">) {
  const labels = useOptionalCalendarLabels();
  const name = booking.customer ?? booking.name;
  const label = labels
    ? expanded
      ? labels.pinCard.minimize({ name })
      : labels.pinCard.expand({ name })
    : name;
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-7 text-muted-foreground hover:text-foreground"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={label}
      title={label}
    >
      {expanded ? (
        <Minimize2Icon aria-hidden className="size-3.5" />
      ) : (
        <Maximize2Icon aria-hidden className="size-3.5" />
      )}
    </Button>
  );
}

/**
 * One order on one day of a timeline: the same card as the pinned and hover calendar cards
 * (`CalendarHoverDetails` detailed, header tinted by its tone, outline from `bookingToneVariants`).
 * The whole card opens the order and hovering it underlines the title; pin and expand sit above
 * that link. Collapsed it shows the stats; expanded it adds the order's facts.
 */
export function OrderDayCard({ booking, href, tone, footer, ...props }: OrderDayCardProps) {
  const name = booking.customer ?? booking.name;
  return (
    <div
      data-slot="order-day-card"
      data-tone={tone}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-colors hover:border-foreground/30",
        bookingToneVariants({ tone }),
        props.className,
      )}
    >
      <CalendarHoverDetails
        booking={booking}
        href={href}
        date={props.date}
        subtitle={props.subtitle}
        detailed
        stretchTitle
        tone={tone}
        hideFacts={!props.expanded}
        extraFacts={props.facts}
        footer={footer ? <div className="relative z-10">{footer}</div> : undefined}
        headerActions={
          <>
            <PinAction booking={booking} name={name} />
            <ExpandButton booking={booking} expanded={props.expanded} onToggle={props.onToggle} />
          </>
        }
      />
    </div>
  );
}
