import type { TicketStatusDto } from "@bibi/core/schemas";
import { ColorSwatch } from "@bibi/ui";

export type TicketStatusLabelProps = { statuses: readonly TicketStatusDto[]; id: string };

/** The ticket's status name with its color ("–" for a status that is no longer listed). */
export function TicketStatusLabel({ statuses, id }: TicketStatusLabelProps) {
  const ticketStatus = statuses.find((candidate) => candidate.id === id);
  if (!ticketStatus) return <>–</>;
  return (
    <span className="inline-flex items-center gap-2">
      <ColorSwatch color={ticketStatus.color} />
      {ticketStatus.name}
    </span>
  );
}
