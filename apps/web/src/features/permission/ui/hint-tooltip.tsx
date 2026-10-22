import { Tooltip, TooltipContent, TooltipTrigger } from "@bibi/ui";
import type { ReactElement } from "react";

export type HintTooltipProps = {
  hint: string;
  /** The trigger: a button, or a span around a disabled control (which gets no pointer events). */
  children: ReactElement;
};

/** The shadcn tooltip with a short explanation, opened on hover or keyboard focus. */
export function HintTooltip({ hint, children }: HintTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  );
}
