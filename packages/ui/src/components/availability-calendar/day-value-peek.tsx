"use client";

import { type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card/hover-card";
import { useCalendarLabels } from "./calendar-labels";
import { type DayTotal, fillOf } from "./day-value";
import { DayValueBar, VALUE_FILLS } from "./day-value-bar";

const PARTS = ["booked", "prebooked", "open"] as const;
const percent = ({ share }: { share: number }) => Math.round(share * 100);

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
  className?: string;
};

/**
 * The heading a day's amounts open from: its name and its bar together. Wraps one element, which
 * passes the trigger's handlers down; with no value it is the element alone.
 */
export function DayValuePeek({ total, day, children }: DayValueProps & { children: ReactNode }) {
  if (!total || !fillOf({ total })) return children;
  return (
    <Peek total={total} day={day}>
      {children}
    </Peek>
  );
}

/**
 * The day's value as a bar under its name, on every day however narrow. The strip around it is
 * taller than the bar, so a finger can tap it; inside a `DayValuePeek` that opens the amounts.
 */
export function DayValueStrip({ total, className }: Omit<DayValueProps, "day">) {
  const labels = useCalendarLabels();
  const fill = total ? fillOf({ total }) : null;
  if (!total || !fill) return null;
  return (
    <button
      type="button"
      aria-label={labels.value.rate({ percent: percent({ share: fill.booked }) })}
      className={cn(
        "flex items-start rounded-sm pt-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <DayValueBar total={total} className="rounded-full" />
    </button>
  );
}
