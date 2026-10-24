"use client";

import { type ComponentProps, useState } from "react";
import { cn } from "../../lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

export type RelativeTimeProps = Omit<ComponentProps<"time">, "children" | "dateTime"> & {
  /** The instant, as ISO 8601. */
  dateTime: string;
  /** The relative text, e.g. "3 days ago". */
  label: string;
  /** The exact date and time in the right zone, shown in the tooltip. */
  exact: string;
};

/**
 * A relative time whose tooltip always shows the exact date and time. Opens on hover and
 * focus (keyboard) and on tap (touch). Needs a `TooltipProvider` above it.
 */
export function RelativeTime({ dateTime, label, exact, className, ...props }: RelativeTimeProps) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-slot="relative-time"
          onClick={() => setOpen(true)}
          className={cn(
            "cursor-default rounded-sm underline decoration-dotted underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
            className,
          )}
        >
          <time dateTime={dateTime} {...props}>
            {label}
          </time>
        </button>
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  );
}
