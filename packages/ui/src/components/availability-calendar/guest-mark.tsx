"use client";

import { UsersRoundIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { useCalendarLabels } from "./calendar-labels";

/**
 * The guests' mark: an ink people icon with the count. Never a hue (hue is the state) and never a
 * ring (that is focus). It sits only where the guests are.
 */
export function GuestMark({ count, className }: { count?: number; className?: string }) {
  const labels = useCalendarLabels();
  return (
    <span
      role="img"
      aria-label={labels.guestsHere(count ? { count } : {})}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-foreground tabular-nums",
        className,
      )}
    >
      <UsersRoundIcon aria-hidden className="size-3.5" strokeWidth={2.25} />
      {count ? <span aria-hidden>{count}</span> : null}
    </span>
  );
}

/** The guest path drawn on a track: a solid ink rule, the one place they are in that stretch. */
export const GUEST_RULE = "rounded-full bg-foreground";
