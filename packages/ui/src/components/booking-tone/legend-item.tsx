"use client";

import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

export type LegendItemProps = {
  /** The swatch, badge or dot that shows the cue. */
  children: ReactNode;
  name: string;
  /** What it means, shown on hover or focus. */
  text?: string | undefined;
};

/** One legend entry: the cue and its word, its meaning in a tooltip on hover or focus. */
export function LegendItem({ children, name, text }: LegendItemProps) {
  const body = (
    <span className="flex items-center gap-1.5">
      {children}
      <span className="text-foreground">{name}</span>
    </span>
  );
  if (!text) return <li>{body}</li>;
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="cursor-help rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {body}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{text}</TooltipContent>
      </Tooltip>
    </li>
  );
}
