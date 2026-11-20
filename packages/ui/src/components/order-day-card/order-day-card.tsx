"use client";

import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useOptionalCalendarLabels } from "../availability-calendar/calendar-labels";
import type { PinnedBooking } from "../availability-calendar/pins-context";
import { attentionOf, type CardSurface, cardSurfaceProps } from "../booking-tone/booking-tone";
import { Button } from "../button/button";
import { CalendarHoverDetails } from "../cursor-hover/cursor-hover-details";
import { PinAction } from "../cursor-hover/hover-actions";
import { LiveBadge, LiveBorder } from "../live-border/live-border";
import type { OrderViewFact } from "../order-view/order-view";

export type OrderDayCardProps = {
  /** The order's day as a booking, so it renders and pins like a calendar booking. */
  booking: PinnedBooking;
  href: string;
  /** Soft, following and done, each its own cue on the surface (`cardSurfaceProps`). */
  surface?: CardSurface | undefined;
  /** A tiny line above the time, e.g. the date or "Day 2 of 3". */
  date: string;
  subtitle?: string | undefined;
  /** The bottom row, above the card's link. */
  footer?: ReactNode;
  /** Now inside its span: this word ("Live") as a green badge by the icons, and a green ring. */
  live?: string | undefined;
  expanded: boolean;
  onToggle: () => void;
  /** Icons before expand and pin, e.g. the order's comments (ADR 0115). */
  actions?: ReactNode;
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
 * (`CalendarHoverDetails` detailed, surface cues and attention bar from `cardSurfaceProps`).
 * The whole card opens the order and hovering it underlines the title; pin and expand sit above
 * that link. Collapsed it shows the stats; expanded it adds the order's facts. Live adds a green
 * badge by the icons and a green shimmering ring, unless an attention border already shows.
 */
export function OrderDayCard({
  booking,
  href,
  surface,
  footer,
  live,
  ...props
}: OrderDayCardProps) {
  const name = booking.customer ?? booking.name;
  const look = cardSurfaceProps({
    surface: {
      attention: attentionOf({
        issues: booking.issues,
        blocked: booking.blocked,
        tentative: booking.state.hold === "soft",
      }),
      ...surface,
    },
  });
  return (
    <div
      data-slot="order-day-card"
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-colors hover:border-foreground/30",
        look.className,
        props.className,
      )}
    >
      {live && !look.attention ? <LiveBorder /> : null}
      <CalendarHoverDetails
        booking={booking}
        href={href}
        date={props.date}
        subtitle={props.subtitle}
        detailed
        stretchTitle
        hideFacts={!props.expanded}
        extraFacts={props.facts}
        footer={footer ? <div className="relative z-10">{footer}</div> : undefined}
        headerActions={
          <>
            {live ? <LiveBadge label={live} /> : null}
            {props.actions}
            <ExpandButton booking={booking} expanded={props.expanded} onToggle={props.onToggle} />
            <PinAction booking={booking} name={name} />
          </>
        }
      />
    </div>
  );
}
