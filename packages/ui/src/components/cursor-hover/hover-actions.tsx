"use client";

import { PinIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { type PinnedBooking, usePins } from "../availability-calendar/pins-context";
import { Button } from "../button/button";

export function PinAction({ booking, name }: { booking: PinnedBooking; name: string }) {
  const pins = usePins();
  if (!pins) return null;
  const pinned = pins.isPinned({ id: booking.id });
  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        "size-7 shrink-0 text-muted-foreground hover:text-foreground",
        pinned && "text-primary hover:text-primary",
      )}
      onClick={(e) => {
        e.stopPropagation();
        pins.toggle({ booking });
      }}
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${name}` : `Pin ${name} to compare`}
      title={pinned ? `Unpin ${name}` : `Pin ${name} to compare`}
    >
      <PinIcon aria-hidden className={cn("size-3.5", pinned && "fill-current")} />
    </Button>
  );
}

export function VisitAction({
  href,
  onOpen,
  title,
}: {
  href?: string;
  onOpen?: () => void;
  title?: string;
}) {
  if (onOpen) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        aria-label={title ? `Open ${title}` : "Open order"}
        title={title ? `Open ${title}` : "Open order"}
      >
        <SquareArrowOutUpRightIcon aria-hidden className="size-3.5" />
      </Button>
    );
  }
  if (href) {
    return (
      <Button
        asChild
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
        aria-label={title ? `Open ${title}` : "Open order"}
        title={title ? `Open ${title}` : "Open order"}
      >
        <AppLink href={href}>
          <SquareArrowOutUpRightIcon aria-hidden className="size-3.5" />
        </AppLink>
      </Button>
    );
  }
  return null;
}
