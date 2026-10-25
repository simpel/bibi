"use client";

import { type ReactNode, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../components/hover-card/hover-card";
import { CalendarDetails, type CalendarDetailsProps } from "./calendar-details";

export type CalendarHoverCardProps = CalendarDetailsProps & {
  children: ReactNode;
  /** Replaces the line card, e.g. the booking card in availability. */
  card?: ReactNode;
};

/**
 * Wraps a calendar item (a block, a buffer, an agenda row) so its details show on hover or focus,
 * and on tap for touch, where hover does not exist. A tap outside closes it.
 */
export function CalendarHoverCard({ children, card, ...details }: CalendarHoverCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={80}>
      <HoverCardTrigger
        asChild
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") setOpen(true);
        }}
        // A click opens the item itself (its ticket, its line), so the peek steps aside.
        onClick={(event) => {
          const touch =
            "pointerType" in event.nativeEvent && event.nativeEvent.pointerType === "touch";
          if (!touch) setOpen(false);
        }}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent side="top" collisionPadding={16} className="w-80 max-w-[calc(100vw-2rem)]">
        {card ?? <CalendarDetails {...details} />}
      </HoverCardContent>
    </HoverCard>
  );
}
