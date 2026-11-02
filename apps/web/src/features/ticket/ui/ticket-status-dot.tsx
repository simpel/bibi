import type { TicketStatusDto } from "@bibi/core/schemas";
import { ColorSwatch, Tooltip, TooltipContent, TooltipTrigger } from "@bibi/ui";

export type TicketStatusDotProps = { statuses: readonly TicketStatusDto[]; id: string };

/** The ticket's status as its color dot, the name in a tooltip and for screen readers. */
export function TicketStatusDot({ statuses, id }: TicketStatusDotProps) {
  const ticketStatus = statuses.find((candidate) => candidate.id === id);
  if (!ticketStatus) return <>–</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex size-5 items-center justify-center">
          <ColorSwatch color={ticketStatus.color} />
          <span className="sr-only">{ticketStatus.name}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{ticketStatus.name}</TooltipContent>
    </Tooltip>
  );
}
