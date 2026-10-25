"use client";

import { type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";
import { badgeVariants } from "../badge/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card/hover-card";
import { useCalendarLabels } from "./calendar-labels";
import { type DayTotal, fillOf } from "./day-value";
import { DayValueBar, VALUE_FILLS } from "./day-value-bar";

const PARTS = ["booked", "prebooked", "open"] as const;
const percent = ({ share }: { share: number }) => Math.round(share * 100);

/** How well the day is sold, at a glance: red under 40% booked, amber from 40%, green from 70%. */
const toneOf = ({ share }: { share: number }) =>
  share >= 0.7 ? "success" : share >= 0.4 ? "warning" : "destructive";

/** The day's allocation: the bar, then its three amounts, each with its swatch. */
function ValueCard({ total, day }: { total: DayTotal; day: string }) {
  const labels = useCalendarLabels();
  return (
    <div className="grid gap-1.5 text-sm">
      <p className="font-medium">{day}</p>
      <DayValueBar total={total} className="h-1.5 rounded-full" />
      {PARTS.map((part) =>
        total[part] === null ? null : (
          <p key={part} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-sm" style={VALUE_FILLS[part]} />
            <span className="flex-1 text-muted-foreground">{labels.value[part]}</span>
            <span className="tabular-nums">
              {labels.money({ amount: total[part] ?? 0, currency: total.currency })}
            </span>
          </p>
        ),
      )}
      <p className="text-xs text-muted-foreground">{labels.value.note}</p>
    </div>
  );
}

/**
 * Shows the day's amounts on hover or focus, and on tap for touch, where hover does not exist
 * (as `CalendarHoverCard`). A tap outside closes it.
 */
function Peek({ total, day, children }: { total: DayTotal; day: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={80}>
      <HoverCardTrigger
        asChild
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") setOpen(true);
        }}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent side="bottom" collisionPadding={16} className="w-64">
        <ValueCard total={total} day={day} />
      </HoverCardContent>
    </HoverCard>
  );
}

export type DayValueProps = {
  total: DayTotal | undefined;
  day: string;
  /** A narrow day: just the share, "48%"; the full label stays its accessible name. */
  compact?: boolean;
  className?: string;
};

/** A label next to the day's name: how much of the day is sold, e.g. "48% booked". */
export function DayRate({ total, day, compact, className }: DayValueProps) {
  const labels = useCalendarLabels();
  const fill = total ? fillOf({ total }) : null;
  if (!total || !fill) return null;
  const booked = percent({ share: fill.booked });
  return (
    <Peek total={total} day={day}>
      <button
        type="button"
        aria-label={labels.value.rate({ percent: booked })}
        className={cn(
          badgeVariants({ variant: toneOf({ share: fill.booked }) }),
          "min-w-0 shrink truncate px-1.5 py-0 leading-5 font-normal tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {compact ? labels.value.share({ percent: booked }) : labels.value.rate({ percent: booked })}
      </button>
    </Peek>
  );
}
