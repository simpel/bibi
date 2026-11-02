import type { TicketDto } from "@bibi/core";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";

export type TicketTitleCellProps = {
  ticket: TicketDto;
  /** The title, or the fallback label for a ticket without one. */
  title: string;
};

/** The title as a link to the ticket. */
export function TicketTitleCell({ ticket, title }: TicketTitleCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={ticketRoute({ id: ticket.id })} className="font-medium hover:underline">
        {title}
      </Link>
    </div>
  );
}
