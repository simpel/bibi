import { CircleHelpIcon } from "lucide-react";
import type { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card/hover-card";

export type DataTableColumnHelpProps = {
  /** Accessible name of the icon, e.g. "About Value". */
  label: string;
  children: ReactNode;
};

/** A help icon in a column header that explains the column in a hover card. */
export function DataTableColumnHelp({ label, children }: DataTableColumnHelpProps) {
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={label}
          // A press on the icon neither sorts nor picks up the column it sits in.
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="inline-flex shrink-0 rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleHelpIcon className="size-3.5" aria-hidden />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="text-left font-normal whitespace-normal">
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}
